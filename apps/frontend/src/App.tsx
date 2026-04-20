import { useState, useEffect } from 'react'
import { api, clearTokens } from './api/client'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Food from './pages/Food'
import WorkoutToday from './pages/WorkoutToday'
import Settings from './pages/Settings'

type Page = 'dashboard' | 'food' | 'workout' | 'settings'

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [page, setPage] = useState<Page>('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.auth.me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function logout() {
    const rt = localStorage.getItem('refreshToken') ?? ''
    api.auth.logout(rt).catch(() => {})
    clearTokens()
    setUser(null)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fa' }}>
      <div style={{ color: '#aaa' }}>Загрузка...</div>
    </div>
  )

  if (!user) return <Auth onAuth={() => api.auth.me().then(setUser)} />

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: 'system-ui, sans-serif', position: 'relative' }}>
      {page === 'dashboard' && <Dashboard user={user} onNavigate={setPage} />}
      {page === 'food' && <Food user={user} onBack={() => setPage('dashboard')} />}
      {page === 'workout' && <WorkoutToday onBack={() => setPage('dashboard')} />}
      {page === 'settings' && (
        <Settings
          user={user}
          onBack={() => setPage('dashboard')}
          onUserUpdate={setUser}
          onLogout={logout}
        />
      )}

      {page === 'dashboard' && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480,
          background: '#fff', borderTop: '1px solid #eee',
          padding: '8px 16px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <button onClick={() => setPage('settings')} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: '4px 8px' }}>
            ⚙️
          </button>
          <button onClick={logout} style={{ background: 'none', border: 'none', fontSize: 13, color: '#aaa', cursor: 'pointer' }}>
            Выйти
          </button>
        </div>
      )}
    </div>
  )
}
