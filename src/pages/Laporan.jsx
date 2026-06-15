import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import * as XLSX from 'xlsx'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts'

function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(angka)
}

function formatTanggalExcel(tanggal) {
  if (!tanggal) return ''

  return new Date(tanggal).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatNamaBulan(value) {
  if (!value) return ''

  const [tahun, bulan] = value.split('-')

  return new Date(Number(tahun), Number(bulan) - 1, 1).toLocaleDateString(
    'id-ID',
    {
      month: 'long',
      year: 'numeric'
    }
  )
}

const WARNA = [
  '#60a5fa',
  '#f87171',
  '#34d399',
  '#fbbf24',
  '#a78bfa',
  '#fb923c',
  '#94a3b8'
]

function Laporan({ user }) {
  const nama =
    user?.user_metadata?.nama ||
    user?.email?.split('@')[0] ||
    'User'

  const [transaksi, setTransaksi] = useState([])
  const [loading, setLoading] = useState(true)

  const [bulan, setBulan] = useState(() => {
    const now = new Date()

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`
  })

  const [tab, setTab] = useState('ringkasan')
  const [filterTipe, setFilterTipe] = useState('semua')
  const [filterUser, setFilterUser] = useState('semua')
  const [exporting, setExporting] = useState(false)
  const [pesanExport, setPesanExport] = useState('')

  useEffect(() => {
    fetchData()
  }, [bulan, filterUser])

  async function fetchData() {
    setLoading(true)

    const awal = new Date(`${bulan}-01`).toISOString()

    const akhir = new Date(`${bulan}-01`)
    akhir.setMonth(akhir.getMonth() + 1)

    const akhirISO = akhir.toISOString()

    let query = supabase
      .from('transaksi')
      .select('*')
      .gte('tanggal', awal)
      .lt('tanggal', akhirISO)
      .order('tanggal', { ascending: false })

    if (filterUser === 'punyaku') {
      query = query.eq('siapa', nama)
    }

    const { data, error } = await query

    if (error) {
      console.error('Gagal mengambil laporan:', error)
      setTransaksi([])
    } else {
      setTransaksi(data || [])
    }

    setLoading(false)
  }

  const pengeluaran = transaksi.filter(
    transaksiItem => transaksiItem.tipe === 'pengeluaran'
  )

  const pemasukan = transaksi.filter(
    transaksiItem => transaksiItem.tipe === 'pemasukan'
  )

  const totalPengeluaran = pengeluaran.reduce(
    (sum, transaksiItem) =>
      sum + Number(transaksiItem.nominal || 0),
    0
  )

  const totalPemasukan = pemasukan.reduce(
    (sum, transaksiItem) =>
      sum + Number(transaksiItem.nominal || 0),
    0
  )

  const saldo = totalPemasukan - totalPengeluaran

  const perKategori = pengeluaran.reduce((acc, transaksiItem) => {
    const kategori = transaksiItem.kategori || 'Tanpa kategori'

    acc[kategori] =
      (acc[kategori] || 0) +
      Number(transaksiItem.nominal || 0)

    return acc
  }, {})

  const pieData = Object.entries(perKategori).map(
    ([name, value]) => ({
      name,
      value
    })
  )

  const perSiapa = transaksi.reduce((acc, transaksiItem) => {
    const siapa = transaksiItem.siapa || 'Tidak diketahui'

    if (!acc[siapa]) {
      acc[siapa] = {
        name: siapa,
        pemasukan: 0,
        pengeluaran: 0
      }
    }

    if (
      transaksiItem.tipe === 'pemasukan' ||
      transaksiItem.tipe === 'pengeluaran'
    ) {
      acc[siapa][transaksiItem.tipe] += Number(
        transaksiItem.nominal || 0
      )
    }

    return acc
  }, {})

  const barData = Object.values(perSiapa)

  const rincianData =
    filterTipe === 'semua'
      ? transaksi
      : transaksi.filter(
          transaksiItem => transaksiItem.tipe === filterTipe
        )

  function handleExportExcel() {
    if (loading) {
      setPesanExport('Data masih dimuat.')
      return
    }

    if (transaksi.length === 0) {
      setPesanExport('Belum ada transaksi yang dapat diekspor.')
      return
    }

    try {
      setExporting(true)
      setPesanExport('')

      const periode = formatNamaBulan(bulan)

      const dataRingkasan = [
        {
          Keterangan: 'Periode laporan',
          Nilai: periode
        },
        {
          Keterangan: 'Filter pengguna',
          Nilai:
            filterUser === 'punyaku'
              ? nama
              : 'Semua anggota keluarga'
        },
        {
          Keterangan: 'Jumlah transaksi',
          Nilai: transaksi.length
        },
        {
          Keterangan: 'Total pemasukan',
          Nilai: totalPemasukan
        },
        {
          Keterangan: 'Total pengeluaran',
          Nilai: totalPengeluaran
        },
        {
          Keterangan: 'Saldo',
          Nilai: saldo
        }
      ]

      const dataTransaksi = transaksi.map(
        (transaksiItem, index) => ({
          No: index + 1,
          Tanggal: formatTanggalExcel(transaksiItem.tanggal),
          Tipe:
            transaksiItem.tipe === 'pemasukan'
              ? 'Pemasukan'
              : 'Pengeluaran',
          Kategori: transaksiItem.kategori || '-',
          Catatan: transaksiItem.catatan || '-',
          Nominal: Number(transaksiItem.nominal || 0),
          Pengguna: transaksiItem.siapa || '-'
        })
      )

      const dataKategori = pieData
        .sort((a, b) => b.value - a.value)
        .map((item, index) => ({
          No: index + 1,
          Kategori: item.name,
          Total: item.value,
          Persentase:
            totalPengeluaran > 0
              ? item.value / totalPengeluaran
              : 0
        }))

      const workbook = XLSX.utils.book_new()

      const worksheetRingkasan =
        XLSX.utils.json_to_sheet(dataRingkasan)

      const worksheetTransaksi =
        XLSX.utils.json_to_sheet(dataTransaksi)

      const worksheetKategori =
        XLSX.utils.json_to_sheet(dataKategori)

      worksheetRingkasan['!cols'] = [
        { wch: 24 },
        { wch: 28 }
      ]

      worksheetTransaksi['!cols'] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 14 },
        { wch: 20 },
        { wch: 35 },
        { wch: 18 },
        { wch: 18 }
      ]

      worksheetKategori['!cols'] = [
        { wch: 6 },
        { wch: 22 },
        { wch: 18 },
        { wch: 14 }
      ]

      const formatRupiahExcel =
        '"Rp" #,##0;[Red]-"Rp" #,##0'

      const rangeRingkasan = XLSX.utils.decode_range(
        worksheetRingkasan['!ref']
      )

      for (
        let row = 1;
        row <= rangeRingkasan.e.r;
        row += 1
      ) {
        const labelCell =
          worksheetRingkasan[
            XLSX.utils.encode_cell({
              r: row,
              c: 0
            })
          ]

        const valueCell =
          worksheetRingkasan[
            XLSX.utils.encode_cell({
              r: row,
              c: 1
            })
          ]

        if (
          labelCell &&
          valueCell &&
          [
            'Total pemasukan',
            'Total pengeluaran',
            'Saldo'
          ].includes(labelCell.v)
        ) {
          valueCell.z = formatRupiahExcel
        }
      }

      const rangeTransaksi = XLSX.utils.decode_range(
        worksheetTransaksi['!ref']
      )

      for (
        let row = 1;
        row <= rangeTransaksi.e.r;
        row += 1
      ) {
        const nominalCell =
          worksheetTransaksi[
            XLSX.utils.encode_cell({
              r: row,
              c: 5
            })
          ]

        if (nominalCell) {
          nominalCell.z = formatRupiahExcel
        }
      }

      const rangeKategori = XLSX.utils.decode_range(
        worksheetKategori['!ref']
      )

      for (
        let row = 1;
        row <= rangeKategori.e.r;
        row += 1
      ) {
        const totalCell =
          worksheetKategori[
            XLSX.utils.encode_cell({
              r: row,
              c: 2
            })
          ]

        const persentaseCell =
          worksheetKategori[
            XLSX.utils.encode_cell({
              r: row,
              c: 3
            })
          ]

        if (totalCell) {
          totalCell.z = formatRupiahExcel
        }

        if (persentaseCell) {
          persentaseCell.z = '0.00%'
        }
      }

      XLSX.utils.book_append_sheet(
        workbook,
        worksheetRingkasan,
        'Ringkasan'
      )

      XLSX.utils.book_append_sheet(
        workbook,
        worksheetTransaksi,
        'Transaksi'
      )

      XLSX.utils.book_append_sheet(
        workbook,
        worksheetKategori,
        'Per Kategori'
      )

      const namaFilter =
        filterUser === 'punyaku'
          ? nama.toLowerCase().replace(/\s+/g, '-')
          : 'semua'

      const namaFile =
        `laporan-keuangan-${bulan}-${namaFilter}.xlsx`

      XLSX.writeFile(workbook, namaFile)

      setPesanExport('Laporan berhasil diekspor ke Excel.')
    } catch (error) {
      console.error('Gagal mengekspor Excel:', error)

      setPesanExport(
        'Laporan gagal diekspor. Silakan coba kembali.'
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Filter bulan */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-xs text-gray-400 mb-1">
          Pilih bulan
        </p>

        <input
          type="month"
          value={bulan}
          onChange={event => setBulan(event.target.value)}
          className="border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-300"
        />
      </div>

      {/* Filter user */}
      <div className="flex rounded-xl overflow-hidden border border-gray-100 bg-white">
        <button
          type="button"
          onClick={() => setFilterUser('semua')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            filterUser === 'semua'
              ? 'bg-blue-500 text-white'
              : 'text-gray-400'
          }`}
        >
          Semua
        </button>

        <button
          type="button"
          onClick={() => setFilterUser('punyaku')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            filterUser === 'punyaku'
              ? 'bg-blue-500 text-white'
              : 'text-gray-400'
          }`}
        >
          Punyaku
        </button>
      </div>

      {/* Tombol export Excel */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">
              Export laporan
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Unduh laporan {formatNamaBulan(bulan)} dalam
              format Excel.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={loading || exporting}
            className="shrink-0 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {exporting ? 'Mengekspor...' : 'Export Excel'}
          </button>
        </div>

        {pesanExport && (
          <p
            className={`mt-3 text-xs ${
              pesanExport.includes('berhasil')
                ? 'text-green-500'
                : 'text-red-400'
            }`}
          >
            {pesanExport}
          </p>
        )}
      </div>

      {/* Tab ringkasan / rincian */}
      <div className="flex rounded-xl overflow-hidden border border-gray-100 bg-white">
        <button
          type="button"
          onClick={() => setTab('ringkasan')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            tab === 'ringkasan'
              ? 'bg-blue-500 text-white'
              : 'text-gray-400'
          }`}
        >
          Ringkasan
        </button>

        <button
          type="button"
          onClick={() => setTab('rincian')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            tab === 'rincian'
              ? 'bg-blue-500 text-white'
              : 'text-gray-400'
          }`}
        >
          Rincian
        </button>
      </div>

      {tab === 'ringkasan' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400">
                Total pemasukan
              </p>

              <p className="text-base font-semibold text-green-500 mt-1">
                {formatRupiah(totalPemasukan)}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400">
                Total pengeluaran
              </p>

              <p className="text-base font-semibold text-red-400 mt-1">
                {formatRupiah(totalPengeluaran)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-4">
              Pengeluaran per kategori
            </p>

            {loading && (
              <p className="text-sm text-gray-300">
                Memuat...
              </p>
            )}

            {!loading && pieData.length === 0 && (
              <p className="text-sm text-gray-300">
                Belum ada data pengeluaran bulan ini.
              </p>
            )}

            {!loading && pieData.length > 0 && (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={
                            WARNA[index % WARNA.length]
                          }
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={value =>
                        formatRupiah(value)
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-2 mt-2">
                  {pieData.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            background:
                              WARNA[
                                index % WARNA.length
                              ]
                          }}
                        />

                        <p className="text-xs text-gray-600">
                          {item.name}
                        </p>
                      </div>

                      <p className="text-xs font-medium text-gray-700">
                        {formatRupiah(item.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {!loading &&
            barData.length > 0 &&
            filterUser === 'semua' && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-500 mb-4">
                  Per anggota keluarga
                </p>

                <ResponsiveContainer
                  width="100%"
                  height={160}
                >
                  <BarChart data={barData} barSize={24}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis hide />

                    <Tooltip
                      formatter={value =>
                        formatRupiah(value)
                      }
                    />

                    <Bar
                      dataKey="pemasukan"
                      fill="#34d399"
                      radius={[4, 4, 0, 0]}
                    />

                    <Bar
                      dataKey="pengeluaran"
                      fill="#f87171"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>

                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />

                    <p className="text-xs text-gray-400">
                      Pemasukan
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />

                    <p className="text-xs text-gray-400">
                      Pengeluaran
                    </p>
                  </div>
                </div>
              </div>
            )}
        </>
      )}

      {tab === 'rincian' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3 gap-2">
            <p className="text-sm font-medium text-gray-500">
              Semua transaksi
            </p>

            <div className="flex gap-1">
              {[
                'semua',
                'pemasukan',
                'pengeluaran'
              ].map(tipe => (
                <button
                  type="button"
                  key={tipe}
                  onClick={() => setFilterTipe(tipe)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filterTipe === tipe
                      ? 'bg-blue-500 text-white'
                      : 'border border-gray-200 text-gray-400'
                  }`}
                >
                  {tipe.charAt(0).toUpperCase() +
                    tipe.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <p className="text-sm text-gray-300">
              Memuat...
            </p>
          )}

          {!loading && rincianData.length === 0 && (
            <p className="text-sm text-gray-300">
              Tidak ada transaksi.
            </p>
          )}

          {!loading &&
            rincianData.map((transaksiItem, index) => (
              <div
                key={transaksiItem.id}
                className={`flex justify-between items-center gap-3 py-2.5 ${
                  index < rincianData.length - 1
                    ? 'border-b border-gray-50'
                    : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {transaksiItem.catatan ||
                      transaksiItem.kategori}
                  </p>

                  <p className="text-xs text-gray-400">
                    {transaksiItem.siapa} ·{' '}
                    {transaksiItem.kategori} ·{' '}
                    {new Date(
                      transaksiItem.tanggal
                    ).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </p>
                </div>

                <p
                  className={`shrink-0 text-sm font-medium ${
                    transaksiItem.tipe === 'pemasukan'
                      ? 'text-green-500'
                      : 'text-red-400'
                  }`}
                >
                  {transaksiItem.tipe === 'pemasukan'
                    ? '+'
                    : '-'}
                  {formatRupiah(transaksiItem.nominal)}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default Laporan