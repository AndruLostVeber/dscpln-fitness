import { useState, useEffect } from 'react'
import { api, clearTokens } from './api/client'
import Auth from './pages/Auth'
import Chat from './pages/Chat'
import Workouts from './pages/Workouts'
import Plan from './pages/Plan'

type Page = 'chat' | 'workouts' | 'plan'

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [page, setPage] = useState<Page>('chat')
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

  if (loading) return <div style={{ padding: 40 }}>Загрузка...</div>
  if (!user) return <Auth onAuth={() => api.auth.me().then(setUser)} />

  const NAV: { key: Page; label: string }[] = [
    { key: 'chat', label: 'Тренер' },
    { key: 'workouts', label: 'Тренировки' },
    { key: 'plan', label: 'План' },
  ]

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #ccc', paddingBottom: 12 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {NAV.map(n => (
            <button key={n.key} onClick={() => setPage(n.key)} style={{
              padding: '6px 14px',
              background: page === n.key ? '#007bff' : 'transparent',
              color: page === n.key ? '#fff' : '#000',
              border: '1px solid #ccc',
              cursor: 'pointer',
              borderRadius: 4,
            }}>
              {n.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 13, color: '#555' }}>
          {user.name}
          <button onClick={logout} style={{ marginLeft: 12, fontSize: 12, cursor: 'pointer' }}>Выйти</button>
        </div>
      </div>

      {page === 'chat' && <Chat />}
      {page === 'workouts' && <Workouts />}
      {page === 'plan' && <Plan />}
    </div>
  )
}
