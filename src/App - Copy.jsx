import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { supabase } from './supabase'
import Dashboard from './pages/Dashboard'
import CatatTransaksi from './pages/CatatTransaksi'
import Laporan from './pages/Laporan'
import Pengaturan from './pages/Pengaturan'
import Login from './pages/Login'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    if (window.confirm('Keluar dari aplikasi?')) {
      await supabase.auth.signOut()
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Memuat...</p>
    </div>
  )

  if (!user) return <Login />

  const nama = user.user_metadata?.nama || user.email?.split('@')[0] || 'User'
  const inisial = nama[0].toUpperCase()

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto">

        {/* Header */}
        <div className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-10">
          <p className="text-sm text-gray-400">Juni 2026</p>
          <div className="flex justify-between items-center mt-1">
            <div className="flex items-center gap-2">
              <img src="/logo depan.PNG" className="w-11 h-11 object-contain" />
              <h1 className="text-lg font-semibold text-gray-800">Uangnya nidia n rizki</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 group"
            >
              <span className="text-xs text-gray-400 group-hover:text-red-400 transition-colors">{nama}</span>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                {inisial}
              </div>
            </button>
          </div>
        </div>

        {/* Konten */}
        <div className="pb-20">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/catat" element={<CatatTransaksi user={user} key={Date.now()} />} />            <Route path="/laporan" element={<Laporan />} />
            <Route path="/pengaturan" element={<Pengaturan />} />
          </Routes>
        </div>

        {/* Navigasi bawah */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 flex justify-around py-2 z-10">
          <NavLink to="/" end className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl text-xs ${isActive ? 'text-blue-500' : 'text-gray-400'}`
          }>
            <img src="/beranda.PNG" className="w-10 h-10 object-contain" />
            Beranda
          </NavLink>
          <NavLink to="/catat" className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl text-xs ${isActive ? 'text-blue-500' : 'text-gray-400'}`
          }>
            <img src="/catat.PNG" className="w-10 h-10 object-contain" />
            Catat
          </NavLink>
          <NavLink to="/laporan" className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl text-xs ${isActive ? 'text-blue-500' : 'text-gray-400'}`
          }>
            <img src="/laporan.PNG" className="w-10 h-10 object-contain" />
            Laporan
          </NavLink>
          <NavLink to="/pengaturan" className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl text-xs ${isActive ? 'text-blue-500' : 'text-gray-400'}`
          }>
            <img src="/setting.PNG" className="w-10 h-10 object-contain" />
            Pengaturan
          </NavLink>
        </div>

      </div>
    </BrowserRouter>
  )
}

export default App