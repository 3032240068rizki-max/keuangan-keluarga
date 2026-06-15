import * as XLSX from "xlsx";

const EXCEL_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function sanitizeFileName(value) {
  return String(value || "laporan")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getNominal(item) {
  const value =
    item.nominal ??
    item.amount ??
    item.jumlah ??
    item.nilai ??
    0;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getTransactionType(item) {
  return (
    item.jenis ??
    item.type ??
    item.transactionType ??
    "-"
  );
}

function getCategory(item) {
  return (
    item.kategori ??
    item.category ??
    "-"
  );
}

function getDescription(item) {
  return (
    item.keterangan ??
    item.description ??
    item.catatan ??
    item.note ??
    "-"
  );
}

function getOwner(item) {
  return (
    item.pemilik ??
    item.owner ??
    item.userName ??
    item.namaPengguna ??
    "-"
  );
}

function downloadFile(file) {
  const blobUrl = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = file.name;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 2000);
}

async function shareFile(file, reportTitle) {
  const shareData = {
    title: reportTitle,
    text: reportTitle,
    files: [file],
  };

  const supportsFileSharing =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });

  if (!supportsFileSharing) {
    return false;
  }

  await navigator.share(shareData);

  return true;
}

function createSummarySheet(transactions, periodLabel) {
  const totalIncome = transactions
    .filter((item) => {
      const type = getTransactionType(item).toLowerCase();

      return (
        type.includes("masuk") ||
        type.includes("pemasukan") ||
        type.includes("income")
      );
    })
    .reduce((total, item) => total + getNominal(item), 0);

  const totalExpense = transactions
    .filter((item) => {
      const type = getTransactionType(item).toLowerCase();

      return (
        type.includes("keluar") ||
        type.includes("pengeluaran") ||
        type.includes("expense")
      );
    })
    .reduce((total, item) => total + getNominal(item), 0);

  const balance = totalIncome - totalExpense;

  const summaryData = [
    ["Laporan Keuangan Keluarga"],
    ["Periode", periodLabel],
    [],
    ["Keterangan", "Nominal"],
    ["Total pemasukan", totalIncome],
    ["Total pengeluaran", totalExpense],
    ["Saldo", balance],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(summaryData);

  worksheet["!cols"] = [
    { wch: 25 },
    { wch: 22 },
  ];

  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 1 },
    },
  ];

  if (worksheet.B5) {
    worksheet.B5.z = '"Rp"#,##0';
  }

  if (worksheet.B6) {
    worksheet.B6.z = '"Rp"#,##0';
  }

  if (worksheet.B7) {
    worksheet.B7.z = '"Rp"#,##0';
  }

  return worksheet;
}

function createTransactionSheet(transactions) {
  const rows = transactions.map((item, index) => ({
    No: index + 1,
    Tanggal: formatDate(
      item.tanggal ??
      item.date ??
      item.createdAt
    ),
    Jenis: getTransactionType(item),
    Kategori: getCategory(item),
    Keterangan: getDescription(item),
    Nominal: getNominal(item),
    Pemilik: getOwner(item),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 16 },
    { wch: 20 },
    { wch: 32 },
    { wch: 18 },
    { wch: 18 },
  ];

  const range = XLSX.utils.decode_range(
    worksheet["!ref"] || "A1:G1"
  );

  for (let row = 1; row <= range.e.r; row += 1) {
    const nominalCell = worksheet[
      XLSX.utils.encode_cell({
        r: row,
        c: 5,
      })
    ];

    if (nominalCell) {
      nominalCell.z = '"Rp"#,##0';
    }
  }

  return worksheet;
}

export async function exportTransactionsToExcel({
  transactions,
  periodLabel = "Juni 2026",
  filePrefix = "laporan-keuangan",
}) {
  if (!Array.isArray(transactions)) {
    throw new Error("Data transaksi tidak valid.");
  }

  if (transactions.length === 0) {
    throw new Error(
      "Belum ada transaksi pada periode ini."
    );
  }

  const workbook = XLSX.utils.book_new();

  const summaryWorksheet = createSummarySheet(
    transactions,
    periodLabel
  );

  const transactionWorksheet =
    createTransactionSheet(transactions);

  XLSX.utils.book_append_sheet(
    workbook,
    summaryWorksheet,
    "Ringkasan"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    transactionWorksheet,
    "Rincian Transaksi"
  );

  const workbookArray = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    compression: true,
  });

  const safePeriod = sanitizeFileName(periodLabel);

  const fileName =
    `${filePrefix}-${safePeriod}.xlsx`;

  const file = new File(
    [workbookArray],
    fileName,
    {
      type: EXCEL_MIME_TYPE,
    }
  );

  try {
    const shared = await shareFile(
      file,
      `Laporan Keuangan ${periodLabel}`
    );

    if (shared) {
      return {
        success: true,
        method: "share",
        fileName,
      };
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      return {
        success: false,
        cancelled: true,
        message: "Proses berbagi file dibatalkan.",
      };
    }

    console.warn(
      "File tidak dapat dibagikan. Menggunakan download biasa.",
      error
    );
  }

  downloadFile(file);

  return {
    success: true,
    method: "download",
    fileName,
  };
}