import { useState } from 'react'
import { api } from '../api/client'

interface Props {
  onBack: () => void
}

const FOCUS_OPTIONS = [
  { value: 'Грудь и трицепс', emoji: '🏋️' },
  { value: 'Спина и бицепс', emoji: '💪' },
  { value: 'Ноги', emoji: '🦵' },
  { value: 'Плечи', emoji: '🔝' },
  { value: 'Всё тело', emoji: '⚡' },
  { value: 'Кардио', emoji: '🏃' },
  { value: 'Пресс и кор', emoji: '🎯' },
]

interface Exercise {
  name: string
  sets: number
  reps: string
  rest: string
}

interface Workout {
  title: string
  duration: string
  difficulty: string
  exercises: Exercise[]
}

export default function WorkoutToday({ onBack }: Props) {
  const [focus, setFocus] = useState('')
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    if (!focus) return
    setError('')
    setLoading(true)
    try {
      const res = await api.ai.workoutSuggestions(focus)
      setWorkouts(res.workouts ?? [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa' }}>
      <div style={{ padding: '20px 16px 12px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0 }}>←</button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Тренировка сегодня</div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Выберите фокус</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {FOCUS_OPTIONS.map(f => (
            <button
              key={f.value}
              onClick={() => { setFocus(f.value); setWorkouts([]) }}
              style={{
                padding: '14px 10px', borderRadius: 12, border: '2px solid',
                borderColor: focus === f.value ? '#007bff' : '#e9ecef',
                background: focus === f.value ? '#f0f6ff' : '#fff',
                cursor: 'pointer', fontSize: 13, fontWeight: focus === f.value ? 600 : 400,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <span style={{ fontSize: 18 }}>{f.emoji}</span>
              {f.value}
            </button>
          ))}
        </div>

        {error && <div style={{ color: 'red', fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <button
          onClick={generate}
          disabled={!focus || loading}
          style={{ width: '100%', padding: '14px', background: '#212529', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: focus ? 'pointer' : 'not-allowed', marginBottom: 20 }}>
          {loading ? 'Генерация...' : '⚡ Сгенерировать 2 варианта'}
        </button>

        {workouts.map((w, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Вариант {i + 1}: {w.title}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  ⏱ {w.duration} · {w.difficulty}
                </div>
              </div>
            </div>

            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f0f0f0', color: '#888' }}>
                  <th style={{ textAlign: 'left', paddingBottom: 6, fontWeight: 500 }}>Упражнение</th>
                  <th style={{ textAlign: 'center', fontWeight: 500 }}>Подх.</th>
                  <th style={{ textAlign: 'center', fontWeight: 500 }}>Повт.</th>
                  <th style={{ textAlign: 'center', fontWeight: 500 }}>Отдых</th>
                </tr>
              </thead>
              <tbody>
                {w.exercises.map((ex, j) => (
                  <tr key={j} style={{ borderBottom: '1px solid #f7f7f7' }}>
                    <td style={{ padding: '7px 0' }}>{ex.name}</td>
                    <td style={{ textAlign: 'center' }}>{ex.sets}</td>
                    <td style={{ textAlign: 'center' }}>{ex.reps}</td>
                    <td style={{ textAlign: 'center', color: '#888' }}>{ex.rest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}
