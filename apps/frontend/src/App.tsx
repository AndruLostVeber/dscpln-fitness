import { useState, useEffect } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { api, clearTokens, saveTokens } from './api/client'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Food from './pages/Food'
import WorkoutToday from './pages/WorkoutToday'
import Settings from './pages/Settings'
import NutritionLog from './pages/NutritionLog'
import WorkoutCalendar from './pages/WorkoutCalendar'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            photo_url?: string
          }
        }
        ready(): void
        expand(): void
        backgroundColor: string
      }
    }
  }
}

type Page = 'dashboard' | 'food' | 'workout' | 'settings' | 'nutrition' | 'calendar'

interface FoodItem {
  name: string
  description: string
  calories: number
  protein: number
  fat: number
  carbs: number
  ingredients?: string[]
  recipe?: string[]
}

const TODAY = new Date().toISOString().split('T')[0]
const isTelegram = typeof window !== 'undefined' && !!window.Telegram?.WebApp?.initData

function loadEaten(): FoodItem[] {
  try {
    const raw = localStorage.getItem(`eaten_${TODAY}`)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveEaten(items: FoodItem[]) {
  localStorage.setItem(`eaten_${TODAY}`, JSON.stringify(items))
}

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [page, setPage] = useState<Page>('dashboard')
  const [loading, setLoading] = useState(true)
  const [eaten, setEaten] = useState<FoodItem[]>(loadEaten)

  useEffect(() => {
    if (isTelegram) {
      const twa = window.Telegram!.WebApp
      twa.ready()
      twa.expand()

      const initData = twa.initData
      api.auth.telegramAuth({ initData })
        .then(res => {
          saveTokens(res.accessToken, res.refreshToken)
          return api.auth.me()
        })
        .then(setUser)
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      api.auth.me()
        .then(setUser)
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [])

  function addEaten(item: FoodItem) {
    setEaten(prev => {
      const next = [...prev, item]
      saveEaten(next)
      return next
    })
  }

  function removeEaten(index: number) {
    setEaten(prev => {
      const next = prev.filter((_, i) => i !== index)
      saveEaten(next)
      return next
    })
  }

  function logout() {
    const rt = localStorage.getItem('refreshToken') ?? ''
    api.auth.logout(rt).catch(() => {})
    clearTokens()
    setUser(null)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0D0F' }}>
      <div style={{ color: '#8E8EA0', fontSize: 14 }}>Загрузка...</div>
    </div>
  )

  // Не авторизован ИЛИ TG-пользователь без профиля → показать Auth
  const needsOnboarding = !user || (isTelegram && !user.profile)
  if (needsOnboarding) {
    const tgUser = isTelegram ? window.Telegram?.WebApp?.initDataUnsafe?.user : undefined
    return (
      <Auth
        onAuth={() => api.auth.me().then(setUser)}
        isTelegram={isTelegram}
        tgUser={tgUser}
        preAuthed={isTelegram && !!user}
      />
    )
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: 'system-ui, sans-serif', position: 'relative' }}>
      {page === 'dashboard' && <Dashboard user={user} eaten={eaten} onNavigate={setPage} />}
      {page === 'food' && (
        <Food
          user={user}
          eaten={eaten}
          onEat={addEaten}
          onRemove={removeEaten}
          onBack={() => setPage('dashboard')}
        />
      )}
      {page === 'workout' && <WorkoutToday onBack={() => setPage('dashboard')} />}
      {page === 'settings' && (
        <Settings user={user} onBack={() => setPage('dashboard')} onUserUpdate={setUser} onLogout={logout} />
      )}
      {page === 'nutrition' && (
        <NutritionLog user={user} eaten={eaten} onRemove={removeEaten} onBack={() => setPage('dashboard')} />
      )}
      {page === 'calendar' && <WorkoutCalendar onBack={() => setPage('dashboard')} />}

      {page === 'dashboard' && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480,
          background: '#16161A', borderTop: '1px solid #2A2A35',
          padding: '10px 24px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <button onClick={() => setPage('settings')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
            <SettingsIcon size={22} color="#8E8EA0" />
          </button>
          {!isTelegram && (
            <button onClick={logout} style={{ background: 'none', border: 'none', fontSize: 13, color: '#8E8EA0', cursor: 'pointer', fontFamily: 'inherit' }}>
              Выйти
            </button>
          )}
        </div>
      )}
    </div>
  )
}
