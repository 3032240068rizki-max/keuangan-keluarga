import * as XLSX from "xlsx";

const formatRupiahNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const formatTanggal = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const exportLaporanKeExcel = ({
  transaksi = [],
  bulan = "Semua",
  namaFile,
}) => {
  if (!Array.isArray(transaksi) || transaksi.length === 0) {
    throw new Error("Belum ada transaksi yang dapat diekspor.");
  }

  const dataLaporan = transaksi.map((item, index) => ({
    No: index + 1,
    Tanggal: formatTanggal(item.tanggal || item.date),
    Jenis:
      item.jenis ||
      item.type ||
      (Number(item.nominal || item.amount) >= 0
        ? "Pemasukan"
        : "Pengeluaran"),
    Kategori: item.kategori || item.category || "-",
    Keterangan: item.keterangan || item.description || "-",
    Nominal: formatRupiahNumber(
      Math.abs(item.nominal ?? item.amount ?? 0)
    ),
    Pengguna: item.pengguna || item.user || "-",
  }));

  const totalPemasukan = transaksi
    .filter((item) => {
      const jenis = String(item.jenis || item.type || "").toLowerCase();
      return jenis === "pemasukan" || jenis === "income";
    })
    .reduce(
      (total, item) =>
        total + formatRupiahNumber(item.nominal ?? item.amount),
      0
    );

  const totalPengeluaran = transaksi
    .filter((item) => {
      const jenis = String(item.jenis || item.type || "").toLowerCase();
      return jenis === "pengeluaran" || jenis === "expense";
    })
    .reduce(
      (total, item) =>
        total +
        Math.abs(formatRupiahNumber(item.nominal ?? item.amount)),
      0
    );

  const ringkasan = [
    {
      Keterangan: "Periode",
      Nilai: bulan,
    },
    {
      Keterangan: "Jumlah transaksi",
      Nilai: transaksi.length,
    },
    {
      Keterangan: "Total pemasukan",
      Nilai: totalPemasukan,
    },
    {
      Keterangan: "Total pengeluaran",
      Nilai: totalPengeluaran,
    },
    {
      Keterangan: "Saldo",
      Nilai: totalPemasukan - totalPengeluaran,
    },
  ];

  const workbook = XLSX.utils.book_new();

  const worksheetLaporan = XLSX.utils.json_to_sheet(dataLaporan);
  const worksheetRingkasan = XLSX.utils.json_to_sheet(ringkasan);

  worksheetLaporan["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 15 },
    { wch: 20 },
    { wch: 35 },
    { wch: 18 },
    { wch: 18 },
  ];

  worksheetRingkasan["!cols"] = [
    { wch: 24 },
    { wch: 20 },
  ];

  const laporanRange = XLSX.utils.decode_range(
    worksheetLaporan["!ref"]
  );

  for (let row = 1; row <= laporanRange.e.r; row += 1) {
    const cellAddress = XLSX.utils.encode_cell({
      r: row,
      c: 5,
    });

    if (worksheetLaporan[cellAddress]) {
      worksheetLaporan[cellAddress].z =
        '"Rp" #,##0;[Red]-"Rp" #,##0';
    }
  }

  const ringkasanRange = XLSX.utils.decode_range(
    worksheetRingkasan["!ref"]
  );

  for (let row = 1; row <= ringkasanRange.e.r; row += 1) {
    const labelCell =
      worksheetRingkasan[
        XLSX.utils.encode_cell({
          r: row,
          c: 0,
        })
      ];

    const valueCell =
      worksheetRingkasan[
        XLSX.utils.encode_cell({
          r: row,
          c: 1,
        })
      ];

    if (
      labelCell &&
      valueCell &&
      [
        "Total pemasukan",
        "Total pengeluaran",
        "Saldo",
      ].includes(labelCell.v)
    ) {
      valueCell.z = '"Rp" #,##0;[Red]-"Rp" #,##0';
    }
  }

  XLSX.utils.book_append_sheet(
    workbook,
    worksheetRingkasan,
    "Ringkasan"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    worksheetLaporan,
    "Transaksi"
  );

  const namaBerkas =
    namaFile ||
    `laporan-keuangan-${String(bulan)
      .toLowerCase()
      .replace(/\s+/g, "-")}.xlsx`;

  XLSX.writeFile(workbook, namaBerkas);
};