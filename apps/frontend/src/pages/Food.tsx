import { useState } from 'react'
import { api } from '../api/client'

interface Props {
  user: any
  onBack: () => void
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

interface FoodItem {
  name: string
  description: string
  calories: number
  protein: number
  fat: number
  carbs: number
}

export default function Food({ user, onBack }: Props) {
  const [want, setWant] = useState('')
  const [suggestions, setSuggestions] = useState<FoodItem[]>([])
  const [eaten, setEaten] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const macros = user.profile ? calcTDEE(user.profile) : null

  const consumed = eaten.reduce(
    (acc, f) => ({ cal: acc.cal + f.calories, p: acc.p + f.protein, f: acc.f + f.fat, c: acc.c + f.carbs }),
    { cal: 0, p: 0, f: 0, c: 0 }
  )

  const remaining = macros
    ? {
        cal: Math.max(0, macros.tdee - consumed.cal),
        p: Math.max(0, macros.protein - consumed.p),
        f: Math.max(0, macros.fat - consumed.f),
        c: Math.max(0, macros.carbs - consumed.c),
      }
    : null

  async function generate() {
    if (!macros || !want.trim()) return
    setError('')
    setLoading(true)
    try {
      const res = await api.ai.foodSuggestions({
        want,
        eatenItems: eaten.map(e => e.name),
        remainingCalories: remaining!.cal,
        remainingProtein: remaining!.p,
        remainingFat: remaining!.f,
        remainingCarbs: remaining!.c,
      })
      setSuggestions(res.suggestions ?? [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function addToEaten(item: FoodItem) {
    setEaten(prev => [...prev, item])
    setSuggestions(prev => prev.filter(s => s.name !== item.name))
  }

  function removeFromEaten(index: number) {
    setEaten(prev => prev.filter((_, i) => i !== index))
  }

  const progressPct = macros ? Math.min(100, Math.round((consumed.cal / macros.tdee) * 100)) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', paddingBottom: 40 }}>
      <div style={{ padding: '20px 16px 12px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0 }}>←</button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Питание сегодня</div>
      </div>

      <div style={{ padding: 16 }}>

        {macros && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 12, color: '#aaa' }}>Съедено</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: progressPct >= 100 ? '#ff6b6b' : '#007bff' }}>
                  {consumed.cal} <span style={{ fontSize: 14, fontWeight: 400, color: '#aaa' }}>/ {macros.tdee} ккал</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#aaa', textAlign: 'right' }}>
                Осталось<br />
                <span style={{ fontSize: 16, fontWeight: 700, color: '#222' }}>{remaining?.cal ?? 0} ккал</span>
              </div>
            </div>

            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, marginBottom: 12 }}>
              <div style={{ height: 6, background: progressPct >= 100 ? '#ff6b6b' : '#007bff', borderRadius: 3, width: `${progressPct}%`, transition: 'width 0.4s' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12 }}>
              {[
                { label: 'Белки', done: consumed.p, total: macros.protein, color: '#ff6b6b' },
                { label: 'Жиры', done: consumed.f, total: macros.fat, color: '#ffa94d' },
                { label: 'Углеводы', done: consumed.c, total: macros.carbs, color: '#69db7c' },
              ].map(m => (
                <div key={m.label} style={{ background: '#f7f8fa', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ color: m.color, fontWeight: 700, fontSize: 14 }}>{m.done}г</div>
                  <div style={{ color: '#bbb', fontSize: 11 }}>{m.label} / {m.total}г</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {eaten.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Уже съел</div>
            {eaten.map((item, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>{item.calories} ккал · Б{item.protein} Ж{item.fat} У{item.carbs}</div>
                </div>
                <button onClick={() => removeFromEaten(i)} style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 18, cursor: 'pointer', padding: '0 4px' }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Что хочешь?</div>
          <input
            value={want}
            onChange={e => setWant(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generate()}
            placeholder="Например: говядина, гречка, яйца..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e9ecef', fontSize: 14, boxSizing: 'border-box' }}
          />
          {error && <div style={{ color: 'red', fontSize: 13, marginTop: 6 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={generate}
              disabled={loading || !want.trim()}
              style={{ flex: 1, padding: '12px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: want.trim() ? 'pointer' : 'not-allowed' }}>
              {loading ? 'Генерация...' : '✨ Предложить'}
            </button>
            {suggestions.length > 0 && (
              <button
                onClick={generate}
                disabled={loading}
                style={{ padding: '12px 14px', background: '#f0f0f0', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
                🔄
              </button>
            )}
          </div>
        </div>

        {suggestions.length > 0 && (
          <div>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Варианты от тренера
            </div>
            {suggestions.map((s, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{s.name}</div>
                  <button
                    onClick={() => addToEaten(s)}
                    style={{ background: '#007bff', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 8 }}>
                    + Съел
                  </button>
                </div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{s.description}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#aaa' }}>
                  <span>🔥 {s.calories} ккал</span>
                  <span>Б {s.protein}г</span>
                  <span>Ж {s.fat}г</span>
                  <span>У {s.carbs}г</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
