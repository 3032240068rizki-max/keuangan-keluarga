import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const KATEGORI_DEFAULT = ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Kesehatan', 'Tagihan', 'Lainnya']

const todayLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]

function CatatTransaksi({ user }) {
  const nama = user?.user_metadata?.nama || user?.email?.split('@')[0] || 'User'

  const [kategoriList, setKategoriList] = useState(() =>
    JSON.parse(localStorage.getItem('kategori') || JSON.stringify(KATEGORI_DEFAULT))
  )
  const [tipe, setTipe] = useState('pengeluaran')
  const [nominal, setNominal] = useState('')
  const [kategori, setKategori] = useState(kategoriList[0] || 'Makanan')
  const [catatan, setCatatan] = useState('')
  const [tanggal, setTanggal] = useState(todayLocal)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function refreshKategori() {
      const saved = JSON.parse(localStorage.getItem('kategori') || JSON.stringify(KATEGORI_DEFAULT))
      setKategoriList(saved)
    }
    refreshKategori()
    document.addEventListener('visibilitychange', refreshKategori)
    return () => document.removeEventListener('visibilitychange', refreshKategori)
  }, [])

  async function handleSubmit() {
    if (!nominal) return alert('Nominal tidak boleh kosong!')
    setLoading(true)

    const { error } = await supabase
      .from('transaksi')
      .insert({
        tipe,
        nominal: parseInt(nominal),
        kategori,
        catatan,
        siapa: nama,
        tanggal: new Date(tanggal).toISOString()
      })

    setLoading(false)

    if (error) {
      alert('Gagal menyimpan: ' + error.message)
    } else {
      alert('Transaksi berhasil disimpan!')
      setNominal('')
      setCatatan('')
      setTanggal(todayLocal())
    }
  }

  return (
    <div className="px-4 py-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">

        {/* Info pencatat */}
        <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
            {nama[0].toUpperCase()}
          </div>
          <p className="text-sm text-gray-500">Dicatat oleh <span className="font-medium text-gray-700">{nama}</span></p>
        </div>

        {/* Tipe */}
        <div className="flex rounded-xl overflow-hidden border border-gray-100">
          <button
            onClick={() => setTipe('pengeluaran')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${tipe === 'pengeluaran' ? 'bg-red-400 text-white' : 'text-gray-400'}`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => setTipe('pemasukan')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${tipe === 'pemasukan' ? 'bg-green-400 text-white' : 'text-gray-400'}`}
          >
            Pemasukan
          </button>
        </div>

        {/* Nominal */}
        <div>
          <p className="text-xs text-gray-400 mb-1">Nominal (Rp)</p>
          <input
            type="number"
            value={nominal}
            onChange={e => setNominal(e.target.value)}
            placeholder="0"
            className="w-full border border-gray-100 rounded-xl px-3 py-2 text-2xl font-semibold text-gray-800 outline-none focus:border-blue-300"
          />
        </div>

        {/* Kategori */}
        <div>
          <p className="text-xs text-gray-400 mb-2">Kategori</p>
          <div className="flex flex-wrap gap-2">
            {kategoriList.map(k => (
              <button
                key={k}
                onClick={() => setKategori(k)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${kategori === k ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-500'}`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Tanggal */}
        <div>
          <p className="text-xs text-gray-400 mb-1">Tanggal</p>
          <input
            type="date"
            value={tanggal}
            max={todayLocal()}
            onChange={e => setTanggal(e.target.value)}
            className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-300"
          />
        </div>

        {/* Catatan */}
        <div>
          <p className="text-xs text-gray-400 mb-1">Catatan (opsional)</p>
          <input
            type="text"
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            placeholder="Contoh: belanja mingguan"
            className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-300"
          />
        </div>

        {/* Tombol simpan */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 rounded-xl transition-colors"
        >
          {loading ? 'Menyimpan...' : 'Simpan transaksi'}
        </button>

      </div>
    </div>
  )
}

export default CatatTransaksi