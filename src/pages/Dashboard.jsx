import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka)
}

function Dashboard() {
  const [transaksi, setTransaksi] = useState([])
  const [totalPemasukan, setTotalPemasukan] = useState(0)
  const [totalPengeluaran, setTotalPengeluaran] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // Ambil semua transaksi untuk hitung saldo
    const { data: semua } = await supabase
      .from('transaksi')
      .select('tipe, nominal')

    if (semua) {
      const pemasukan = semua.filter(t => t.tipe === 'pemasukan').reduce((sum, t) => sum + t.nominal, 0)
      const pengeluaran = semua.filter(t => t.tipe === 'pengeluaran').reduce((sum, t) => sum + t.nominal, 0)
      setTotalPemasukan(pemasukan)
      setTotalPengeluaran(pengeluaran)
    }

    // Ambil 10 terakhir untuk ditampilkan
    const { data: terakhir } = await supabase
      .from('transaksi')
      .select('*')
      .order('tanggal', { ascending: false })
      .limit(10)

    if (terakhir) setTransaksi(terakhir)
    setLoading(false)
  }

  async function hapusTransaksi(id) {
    const konfirmasi = window.confirm('Hapus transaksi ini?')
    if (!konfirmasi) return

    const { error } = await supabase
      .from('transaksi')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Gagal menghapus: ' + error.message)
    } else {
      setTransaksi(prev => prev.filter(t => t.id !== id))
      fetchData()
    }
  }

  const saldo = totalPemasukan - totalPengeluaran

  return (
    <div className="px-4 py-4 space-y-4">

      {/* Saldo */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-gray-400">Saldo bersama</p>
        <p className="text-3xl font-semibold text-gray-800 mt-1">
          {loading ? '...' : formatRupiah(saldo)}
        </p>
        <div className="flex gap-6 mt-3">
          <div>
            <p className="text-xs text-gray-400">Pemasukan</p>
            <p className="text-sm font-medium text-green-500">
              +{formatRupiah(totalPemasukan)}
            </p>
          </div>
          <div className="w-px bg-gray-100"></div>
          <div>
            <p className="text-xs text-gray-400">Pengeluaran</p>
            <p className="text-sm font-medium text-red-400">
              -{formatRupiah(totalPengeluaran)}
            </p>
          </div>
        </div>
      </div>

      {/* Transaksi terakhir */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-500 mb-3">Transaksi terakhir</p>

        {loading && (
          <p className="text-sm text-gray-300">Memuat data...</p>
        )}

        {!loading && transaksi.length === 0 && (
          <p className="text-sm text-gray-300">Belum ada transaksi.</p>
        )}

        {!loading && transaksi.map((t, i) => (
          <div
            key={t.id}
            className={`flex justify-between items-center py-2.5 ${i < transaksi.length - 1 ? 'border-b border-gray-50' : ''}`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">
                {t.catatan || t.kategori}
              </p>
              <p className="text-xs text-gray-400">
                {t.siapa} · {t.kategori} · {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className={`text-sm font-medium ${t.tipe === 'pemasukan' ? 'text-green-500' : 'text-red-400'}`}>
                {t.tipe === 'pemasukan' ? '+' : '-'}{formatRupiah(t.nominal)}
              </p>
              <button
                onClick={() => hapusTransaksi(t.id)}
                className="w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default Dashboard