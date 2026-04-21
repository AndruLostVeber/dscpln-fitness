import { useEffect, useState, useRef } from 'react'
import { UtensilsCrossed, Dumbbell, Salad, Calendar, RefreshCw } from 'lucide-react'
import { api } from '../api/client'

const C = {
  bg: '#0D0D0F', card: '#16161A', card2: '#1E1E26',
  border: '#2A2A35', orange: '#FF6B35', orangeGlow: 'rgba(255,107,53,0.12)',
  white: '#FFFFFF', gray: '#8E8EA0', gray2: '#404050',
  green: '#4ADE80', red: '#FF4757',
}

interface FoodItem { name: string; calories: number; protein: number; fat: number; carbs: number }

interface Props {
  user: any
  eaten: FoodItem[]
  onNavigate: (page: 'food' | 'workout' | 'nutrition' | 'calendar') => void
}

const ACTIVITY = { sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55, very_active: 1.725 }
const GOAL_DELTA = { lose_weight: -400, gain_muscle: 300, maintain: 0, improve_endurance: 100, flexibility: 0 }

function calcTDEE(profile: any) {
  const dob = new Date(profile.dateOfBirth)
  const age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  const bmr = profile.gender === 'female'
    ? 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age - 161
    : 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age + 5
  const activity = ACTIVITY[profile.activityLevel as keyof typeof ACTIVITY] ?? 1.375
  const delta = GOAL_DELTA[profile.goal as keyof typeof GOAL_DELTA] ?? 0
  const tdee = Math.round(bmr * activity + delta)
  const protein = Math.round(profile.weightKg * 2)
  const fat = Math.round((tdee * 0.25) / 9)
  const carbs = Math.round((tdee - protein * 4 - fat * 9) / 4)
  return { tdee, protein, fat, carbs }
}

export default function Dashboard({ user, eaten, onNavigate }: Props) {
  const [motivation, setMotivation] = useState('')
  const [motivLoading, setMotivLoading] = useState(true)
  const profile = user.profile
  const macros = profile ? calcTDEE(profile) : null
  const fetchingRef = useRef(false)

  const consumed = eaten.reduce(
    (acc, f) => ({ cal: acc.cal + f.calories, p: acc.p + f.protein, f: acc.f + f.fat, c: acc.c + f.carbs }),
    { cal: 0, p: 0, f: 0, c: 0 }
  )

  async function fetchMotivation() {
    if (!macros || fetchingRef.current) return
    fetchingRef.current = true
    setMotivLoading(true)
    try {
      // Загружаем тренировки чтобы узнать активность этой недели
      const sessions = await api.workouts.list().catch(() => [] as any[])
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekSessions = sessions.filter((s: any) => new Date(s.createdAt) >= weekStart)
      const workoutsThisWeek = weekSessions.length

      let lastWorkoutDaysAgo: number | undefined
      if (sessions.length > 0) {
        const sorted = [...sessions].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        const last = new Date(sorted[0].createdAt)
        const today = new Date(); today.setHours(0, 0, 0, 0); last.setHours(0, 0, 0, 0)
        lastWorkoutDaysAgo = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
      }

      const r = await api.ai.motivation({
        consumedCalories: consumed.cal,
        targetCalories: macros.tdee,
        consumedProtein: consumed.p,
        targetProtein: macros.protein,
        consumedFat: consumed.f,
        consumedCarbs: consumed.c,
        workoutsThisWeek,
        lastWorkoutDaysAgo,
      })
      setMotivation(r.message)
    } catch { setMotivation('') }
    finally { setMotivLoading(false); fetchingRef.current = false }
  }

  // При первом рендере и при изменении eaten
  const prevEatenLen = useRef(-1)
  useEffect(() => {
    if (prevEatenLen.current === eaten.length) return
    prevEatenLen.current = eaten.length
    fetchMotivation()
  }, [eaten.length, !!macros])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Доброе утро'
    if (h < 17) return 'Добрый день'
    return 'Добрый вечер'
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 80 }}>
      <div style={{ padding: '56px 20px 20px' }}>
        <div style={{ fontSize: 13, color: C.gray }}>{greeting()},</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.white, marginTop: 2 }}>{user.name}</div>
      </div>

      {macros && (
        <div style={{ margin: '0 16px 20px', background: `linear-gradient(135deg, ${C.orange} 0%, #FF9F1C 100%)`, borderRadius: 24, padding: '24px 24px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 60, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', bottom: -30, right: 30, width: 80, height: 80, borderRadius: 40, background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Дневная норма</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{macros.tdee}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>ккал</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Белки', value: macros.protein },
              { label: 'Жиры', value: macros.fat },
              { label: 'Углеводы', value: macros.carbs },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 12px', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{m.value}г</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <button onClick={() => onNavigate('food')} style={{
          padding: '24px 20px', borderRadius: 20, background: C.card,
          border: `1px solid ${C.border}`, textAlign: 'left', cursor: 'pointer',
        }}>
          <div style={{ marginBottom: 10 }}><UtensilsCrossed size={32} color={C.gray} /></div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.white }}>Еда</div>
          <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>Подобрать блюда</div>
        </button>
        <button onClick={() => onNavigate('workout')} style={{
          padding: '24px 20px', borderRadius: 20,
          background: `linear-gradient(135deg, ${C.orange}22 0%, ${C.card} 100%)`,
          border: `1px solid ${C.orange}44`, textAlign: 'left', cursor: 'pointer',
        }}>
          <div style={{ marginBottom: 10 }}><Dumbbell size={32} color={C.orange} /></div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.white }}>Тренировка</div>
          <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>Начать сессию</div>
        </button>
      </div>

      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <button onClick={() => onNavigate('nutrition')} style={{
          padding: '18px 20px', borderRadius: 20, background: C.card,
          border: `1px solid ${C.border}`, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Salad size={26} color={C.gray} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Рацион</div>
            <div style={{ fontSize: 11, color: C.gray }}>Сегодня</div>
          </div>
        </button>
        <button onClick={() => onNavigate('calendar')} style={{
          padding: '18px 20px', borderRadius: 20, background: C.card,
          border: `1px solid ${C.border}`, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Calendar size={26} color={C.gray} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Календарь</div>
            <div style={{ fontSize: 11, color: C.gray }}>История</div>
          </div>
        </button>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: 1.2 }}>Совет тренера</div>
          <button onClick={fetchMotivation} disabled={motivLoading} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', color: C.gray2 }}>
            <RefreshCw size={14} style={{ animation: motivLoading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
        <div style={{ background: C.card, borderRadius: 20, padding: '18px 20px', border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.orange}` }}>
          {motivLoading
            ? <div style={{ color: C.gray2, fontSize: 14 }}>Анализирую данные...</div>
            : <div style={{ fontSize: 15, color: C.white, lineHeight: 1.6 }}>{motivation || '—'}</div>
          }
        </div>
      </div>
    </div>
  )
}
