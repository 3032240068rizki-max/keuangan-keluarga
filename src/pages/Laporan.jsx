import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'

function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)
}

const WARNA = ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#fb923c', '#94a3b8']

function Laporan() {
  const [transaksi, setTransaksi] = useState([])
  const [loading, setLoading] = useState(true)
  const [bulan, setBulan] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    fetchData()
  }, [bulan])

  async function fetchData() {
    setLoading(true)
    const awal = new Date(`${bulan}-01`).toISOString()
    const akhir = new Date(`${bulan}-01`)
    akhir.setMonth(akhir.getMonth() + 1)
    const akhirISO = akhir.toISOString()

    const { data, error } = await supabase
      .from('transaksi')
      .select('*')
      .gte('tanggal', awal)
      .lt('tanggal', akhirISO)

    if (!error) setTransaksi(data)
    setLoading(false)
  }
  
  const pengeluaran = transaksi.filter(t => t.tipe === 'pengeluaran')
  const pemasukan = transaksi.filter(t => t.tipe === 'pemasukan')

  const totalPengeluaran = pengeluaran.reduce((sum, t) => sum + t.nominal, 0)
  const totalPemasukan = pemasukan.reduce((sum, t) => sum + t.nominal, 0)

  // Data pie per kategori
  const perKategori = pengeluaran.reduce((acc, t) => {
    acc[t.kategori] = (acc[t.kategori] || 0) + t.nominal
    return acc
  }, {})
  const pieData = Object.entries(perKategori).map(([name, value]) => ({ name, value }))

  // Data bar per siapa
  const perSiapa = transaksi.reduce((acc, t) => {
    if (!acc[t.siapa]) acc[t.siapa] = { name: t.siapa, pemasukan: 0, pengeluaran: 0 }
    acc[t.siapa][t.tipe] += t.nominal
    return acc
  }, {})
  const barData = Object.values(perSiapa)

  return (
    <div className="px-4 py-4 space-y-4">

      {/* Filter bulan */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-xs text-gray-400 mb-1">Pilih bulan</p>
        <input
          type="month"
          value={bulan}
          onChange={e => setBulan(e.target.value)}
          className="border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-300"
        />
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400">Total pemasukan</p>
          <p className="text-base font-semibold text-green-500 mt-1">{formatRupiah(totalPemasukan)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400">Total pengeluaran</p>
          <p className="text-base font-semibold text-red-400 mt-1">{formatRupiah(totalPengeluaran)}</p>
        </div>
      </div>

      {/* Pie chart pengeluaran per kategori */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-500 mb-4">Pengeluaran per kategori</p>
        {loading && <p className="text-sm text-gray-300">Memuat...</p>}
        {!loading && pieData.length === 0 && (
          <p className="text-sm text-gray-300">Belum ada data pengeluaran bulan ini.</p>
        )}
        {!loading && pieData.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={WARNA[i % WARNA.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => formatRupiah(val)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {pieData.map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: WARNA[i % WARNA.length] }}></div>
                    <p className="text-xs text-gray-600">{item.name}</p>
                  </div>
                  <p className="text-xs font-medium text-gray-700">{formatRupiah(item.value)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bar chart per anggota */}
      {!loading && barData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-4">Per anggota keluarga</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} barSize={24}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis hide />
              <Tooltip formatter={(val) => formatRupiah(val)} />
              <Bar dataKey="pemasukan" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pengeluaran" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
              <p className="text-xs text-gray-400">Pemasukan</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <p className="text-xs text-gray-400">Pengeluaran</p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Laporan