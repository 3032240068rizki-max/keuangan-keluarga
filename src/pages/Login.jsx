import { useState } from 'react'
import { supabase } from '../supabase'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nama, setNama] = useState('')
  const [mode, setMode] = useState('masuk')
  const [loading, setLoading] = useState(false)

  async function handleMasuk() {
    if (!email || !password) return alert('Email dan password wajib diisi!')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert('Gagal masuk: ' + error.message)
    setLoading(false)
  }

  async function handleDaftar() {
    if (!email || !password || !nama) return alert('Semua field wajib diisi!')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nama } }
    })
    if (error) alert('Gagal daftar: ' + error.message)
    else alert('Pendaftaran berhasil! Silakan masuk.')
    setLoading(false)
    setMode('masuk')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-4xl mb-2">🏠</p>
          <h1 className="text-xl font-semibold text-gray-800">Keluarga Kecil</h1>
          <p className="text-sm text-gray-400 mt-1">Catat keuangan bersama</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">

          {/* Toggle masuk/daftar */}
          <div className="flex rounded-xl overflow-hidden border border-gray-100 mb-4">
            <button
              onClick={() => setMode('masuk')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'masuk' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
            >
              Masuk
            </button>
            <button
              onClick={() => setMode('daftar')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'daftar' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
            >
              Daftar
            </button>
          </div>

          {mode === 'daftar' && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Nama</p>
              <input
                type="text"
                value={nama}
                onChange={e => setNama(e.target.value)}
                placeholder="Contoh: Rizki"
                className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-300"
              />
            </div>
          )}

          <div>
            <p className="text-xs text-gray-400 mb-1">Email</p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-300"
            />
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">Password</p>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-300"
            />
          </div>

          <button
            onClick={mode === 'masuk' ? handleMasuk : handleDaftar}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 rounded-xl transition-colors mt-2"
          >
            {loading ? 'Memproses...' : mode === 'masuk' ? 'Masuk' : 'Daftar'}
          </button>

        </div>
      </div>
    </div>
  )
}

export default Login