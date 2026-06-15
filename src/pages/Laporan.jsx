import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'

function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)
}

const WARNA = ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#fb923c', '#94a3b8']

function Laporan({ user }) {
  const nama = user?.user_metadata?.nama || user?.email?.split('@')[0] || 'User'

  const [transaksi, setTransaksi] = useState([])
  const [loading, setLoading] = useState(true)
  const [bulan, setBulan] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [tab, setTab] = useState('ringkasan')
  const [filterTipe, setFilterTipe] = useState('semua')
  const [filterUser, setFilterUser] = useState('semua')

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

    if (filterUser === 'punyaku') query = query.eq('siapa', nama)

    const { data, error } = await query
    if (!error) setTransaksi(data)
    setLoading(false)
  }

  const pengeluaran = transaksi.filter(t => t.tipe === 'pengeluaran')
  const pemasukan = transaksi.filter(t => t.tipe === 'pemasukan')
  const totalPengeluaran = pengeluaran.reduce((sum, t) => sum + t.nominal, 0)
  const totalPemasukan = pemasukan.reduce((sum, t) => sum + t.nominal, 0)

  const perKategori = pengeluaran.reduce((acc, t) => {
    acc[t.kategori] = (acc[t.kategori] || 0) + t.nominal
    return acc
  }, {})
  const pieData = Object.entries(perKategori).map(([name, value]) => ({ name, value }))

  const perSiapa = transaksi.reduce((acc, t) => {
    if (!acc[t.siapa]) acc[t.siapa] = { name: t.siapa, pemasukan: 0, pengeluaran: 0 }
    acc[t.siapa][t.tipe] += t.nominal
    return acc
  }, {})
  const barData = Object.values(perSiapa)

  const rincianData = filterTipe === 'semua'
    ? transaksi
    : transaksi.filter(t => t.tipe === filterTipe)

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

      {/* Filter user */}
      <div className="flex rounded-xl overflow-hidden border border-gray-100 bg-white">
        <button
          onClick={() => setFilterUser('semua')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${filterUser === 'semua' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilterUser('punyaku')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${filterUser === 'punyaku' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
        >
          Punyaku
        </button>
      </div>

      {/* Tab ringkasan / rincian */}
      <div className="flex rounded-xl overflow-hidden border border-gray-100 bg-white">
        <button
          onClick={() => setTab('ringkasan')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === 'ringkasan' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
        >
          Ringkasan
        </button>
        <button
          onClick={() => setTab('rincian')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === 'rincian' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
        >
          Rincian
        </button>
      </div>

      {tab === 'ringkasan' && (
        <>
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

          {!loading && barData.length > 0 && filterUser === 'semua' && (
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
        </>
      )}

      {tab === 'rincian' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-gray-500">Semua transaksi</p>
            <div className="flex gap-1">
              {['semua', 'pemasukan', 'pengeluaran'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterTipe(t)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${filterTipe === t ? 'bg-blue-500 text-white' : 'border border-gray-200 text-gray-400'}`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading && <p className="text-sm text-gray-300">Memuat...</p>}

          {!loading && rincianData.length === 0 && (
            <p className="text-sm text-gray-300">Tidak ada transaksi.</p>
          )}

          {!loading && rincianData.map((t, i) => (
            <div
              key={t.id}
              className={`flex justify-between items-center py-2.5 ${i < rincianData.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{t.catatan || t.kategori}</p>
                <p className="text-xs text-gray-400">
                  {t.siapa} · {t.kategori} · {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <p className={`text-sm font-medium ${t.tipe === 'pemasukan' ? 'text-green-500' : 'text-red-400'}`}>
                {t.tipe === 'pemasukan' ? '+' : '-'}{formatRupiah(t.nominal)}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

export default Laporan