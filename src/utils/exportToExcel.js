import * as XLSX from "xlsx";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function sanitizeFileName(value) {
  return String(value || "laporan")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 3000);
}

function createRows(transactions) {
  return transactions.map((item, index) => ({
    No: index + 1,
    Tanggal:
      item.tanggal ??
      item.date ??
      item.createdAt ??
      "",
    Jenis:
      item.jenis ??
      item.type ??
      "",
    Kategori:
      item.kategori ??
      item.category ??
      "",
    Keterangan:
      item.keterangan ??
      item.description ??
      item.catatan ??
      "",
    Nominal: Number(
      item.nominal ??
      item.amount ??
      item.jumlah ??
      0
    ),
    Pemilik:
      item.pemilik ??
      item.owner ??
      item.userName ??
      "",
  }));
}

function createExcelFile(transactions, periodLabel) {
  const rows = createRows(transactions);

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 32 },
    { wch: 18 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Rincian Transaksi"
  );

  const arrayBuffer = XLSX.write(workbook, {
    type: "array",
    bookType: "xlsx",
    compression: true,
  });

  const fileName =
    `laporan-${sanitizeFileName(periodLabel)}.xlsx`;

  return new File(
    [arrayBuffer],
    fileName,
    {
      type: XLSX_MIME,
      lastModified: Date.now(),
    }
  );
}

function createCsvFile(transactions, periodLabel) {
  const rows = createRows(transactions);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  const csv = XLSX.utils.sheet_to_csv(worksheet);

  const csvWithBom = `\uFEFF${csv}`;

  const fileName =
    `laporan-${sanitizeFileName(periodLabel)}.csv`;

  return new File(
    [csvWithBom],
    fileName,
    {
      type: "text/csv;charset=utf-8",
      lastModified: Date.now(),
    }
  );
}

async function shareFile(file) {
  if (typeof navigator.share !== "function") {
    throw new Error(
      "Perangkat ini tidak mendukung fitur berbagi file."
    );
  }

  if (
    typeof navigator.canShare === "function" &&
    !navigator.canShare({ files: [file] })
  ) {
    throw new Error(
      `iPhone tidak mengizinkan file ${file.name} dibagikan.`
    );
  }

  await navigator.share({
    files: [file],
  });
}

export async function exportReport({
  transactions,
  periodLabel = "Juni 2026",
}) {
  if (!Array.isArray(transactions)) {
    throw new Error("Data transaksi tidak valid.");
  }

  if (transactions.length === 0) {
    throw new Error(
      "Tidak ada transaksi untuk diekspor."
    );
  }

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (
      navigator.platform === "MacIntel" &&
      navigator.maxTouchPoints > 1
    );

  const isStandalone =
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches ||
    window.navigator.standalone === true;

  const excelFile = createExcelFile(
    transactions,
    periodLabel
  );

  console.log("Export diagnostics", {
    isIOS,
    isStandalone,
    fileName: excelFile.name,
    fileType: excelFile.type,
    fileSize: excelFile.size,
    hasShare:
      typeof navigator.share === "function",
    hasCanShare:
      typeof navigator.canShare === "function",
    canShareExcel:
      typeof navigator.canShare === "function"
        ? navigator.canShare({
            files: [excelFile],
          })
        : null,
  });

  /*
   * iPhone atau aplikasi Home Screen:
   * prioritaskan share sheet.
   */
  if (isIOS || isStandalone) {
    try {
      await shareFile(excelFile);

      return {
        success: true,
        method: "share-xlsx",
        message:
          "File Excel berhasil dibuat. Pilih Save to Files.",
      };
    } catch (excelError) {
      console.error(
        "Share XLSX gagal:",
        excelError
      );

      /*
       * Fallback CSV untuk iPhone.
       */
      const csvFile = createCsvFile(
        transactions,
        periodLabel
      );

      try {
        await shareFile(csvFile);

        return {
          success: true,
          method: "share-csv",
          message:
            "Excel tidak didukung oleh perangkat ini. Laporan dibagikan dalam format CSV yang tetap dapat dibuka di Excel.",
        };
      } catch (csvError) {
        console.error(
          "Share CSV gagal:",
          csvError
        );

        throw new Error(
          [
            "iPhone gagal membagikan file.",
            `XLSX: ${
              excelError?.message ||
              "tidak diketahui"
            }`,
            `CSV: ${
              csvError?.message ||
              "tidak diketahui"
            }`,
          ].join(" ")
        );
      }
    }
  }

  /*
   * Browser desktop.
   */
  downloadBlob(excelFile, excelFile.name);

  return {
    success: true,
    method: "download-xlsx",
    message: "Laporan Excel berhasil diunduh.",
  };
}