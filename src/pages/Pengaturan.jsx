import { useState } from 'react'

const KATEGORI_DEFAULT = ['Makanan', 'Transportasi', 'Belanja', 'Hiburan', 'Kesehatan', 'Tagihan', 'Lainnya']

function Pengaturan() {
  const [anggota, setAnggota] = useState(
    () => JSON.parse(localStorage.getItem('anggota') || '["Rizki","Nidia"]')
  )
  const [kategori, setKategori] = useState(
    () => JSON.parse(localStorage.getItem('kategori') || JSON.stringify(KATEGORI_DEFAULT))
  )
  const [namaAnggota, setNamaAnggota] = useState('')
  const [namaKategori, setNamaKategori] = useState('')

  function simpanAnggota(data) {
    setAnggota(data)
    localStorage.setItem('anggota', JSON.stringify(data))
  }

  function simpanKategori(data) {
    setKategori(data)
    localStorage.setItem('kategori', JSON.stringify(data))
  }

  function tambahAnggota() {
    const nama = namaAnggota.trim()
    if (!nama) return
    if (anggota.includes(nama)) return alert('Nama sudah ada!')
    simpanAnggota([...anggota, nama])
    setNamaAnggota('')
  }

  function hapusAnggota(nama) {
    if (anggota.length <= 1) return alert('Minimal harus ada 1 anggota!')
    simpanAnggota(anggota.filter(a => a !== nama))
  }

  function tambahKategori() {
    const nama = namaKategori.trim()
    if (!nama) return
    if (kategori.includes(nama)) return alert('Kategori sudah ada!')
    simpanKategori([...kategori, nama])
    setNamaKategori('')
  }

  function hapusKategori(nama) {
    if (kategori.length <= 1) return alert('Minimal harus ada 1 kategori!')
    simpanKategori(kategori.filter(k => k !== nama))
  }

  function resetKategori() {
    if (window.confirm('Reset kategori ke default?')) {
      simpanKategori(KATEGORI_DEFAULT)
    }
  }

  return (
    <div className="px-4 py-4 space-y-4">

      {/* Anggota keluarga */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-500 mb-3">Anggota keluarga</p>

        <div className="space-y-2 mb-3">
          {anggota.map((nama, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                  {nama[0]}
                </div>
                <p className="text-sm text-gray-700">{nama}</p>
              </div>
              <button
                onClick={() => hapusAnggota(nama)}
                className="text-gray-200 hover:text-red-400 transition-colors text-sm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={namaAnggota}
            onChange={e => setNamaAnggota(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tambahAnggota()}
            placeholder="Nama anggota baru"
            className="flex-1 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-300"
          />
          <button
            onClick={tambahAnggota}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 rounded-xl transition-colors"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* Kategori */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-medium text-gray-500">Kategori</p>
          <button
            onClick={resetKategori}
            className="text-xs text-gray-300 hover:text-blue-400 transition-colors"
          >
            Reset default
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {kategori.map((k, i) => (
            <div key={i} className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
              <span className="text-xs text-gray-600">{k}</span>
              <button
                onClick={() => hapusKategori(k)}
                className="text-gray-300 hover:text-red-400 transition-colors text-xs ml-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={namaKategori}
            onChange={e => setNamaKategori(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tambahKategori()}
            placeholder="Kategori baru"
            className="flex-1 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-300"
          />
          <button
            onClick={tambahKategori}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 rounded-xl transition-colors"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* Info app */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-500 mb-2">Tentang aplikasi</p>
        <p className="text-xs text-gray-400">Keuangan Keluarga v1.0</p>
        <p className="text-xs text-gray-400 mt-0.5">Dibuat dengan ❤️ untuk keluarga kecil</p>
      </div>

    </div>
  )
}

export default Pengaturan