import { useEffect, useState } from 'react'
import { api } from '../api/client'

interface Props {
  user: any
  onNavigate: (page: 'food' | 'workout') => void
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

export default function Dashboard({ user, onNavigate }: Props) {
  const [motivation, setMotivation] = useState('')
  const [motivLoading, setMotivLoading] = useState(true)

  const profile = user.profile
  const macros = profile ? calcTDEE(profile) : null

  useEffect(() => {
    api.ai.motivation()
      .then(r => setMotivation(r.message))
      .catch(() => setMotivation(''))
      .finally(() => setMotivLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', display: 'flex', flexDirection: 'column' }}>

      <div style={{ padding: '24px 20px 12px', background: '#fff', borderBottom: '1px solid #eee' }}>
        <div style={{ fontSize: 13, color: '#888' }}>Привет, {user.name} 👋</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>Сегодня</div>
      </div>

      {macros && (
        <div style={{ margin: 16, background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Дневная норма</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: '#007bff', lineHeight: 1 }}>{macros.tdee}</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>ккал</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'Белки', value: macros.protein, unit: 'г', color: '#ff6b6b' },
              { label: 'Жиры', value: macros.fat, unit: 'г', color: '#ffa94d' },
              { label: 'Углеводы', value: macros.carbs, unit: 'г', color: '#69db7c' },
            ].map(m => (
              <div key={m.label} style={{ background: '#f7f8fa', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: m.color }}>{m.value}{m.unit}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '0 16px' }}>
        <button onClick={() => onNavigate('food')} style={{
          padding: '22px 16px', borderRadius: 16, border: 'none',
          background: '#007bff', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
        }}>
          🍽 Еда
        </button>
        <button onClick={() => onNavigate('workout')} style={{
          padding: '22px 16px', borderRadius: 16, border: 'none',
          background: '#212529', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
        }}>
          💪 Тренировка
        </button>
      </div>

      <div style={{ margin: 16, marginTop: 20 }}>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Тренер говорит
        </div>
        <div style={{
          background: '#fff', borderRadius: 16, padding: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          borderLeft: '4px solid #007bff',
          fontSize: 15, lineHeight: 1.6, color: '#222',
          minHeight: 60,
        }}>
          {motivLoading
            ? <span style={{ color: '#bbb' }}>Загрузка...</span>
            : motivation || '—'}
        </div>
      </div>
    </div>
  )
}
