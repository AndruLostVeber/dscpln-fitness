import { useState } from 'react'
import { api } from '../api/client'

interface PlanExercise {
  name: string
  sets: number
  reps: number
  restSec: number
  notes: string
}

interface PlanDay {
  day: string
  focus: string
  exercises: PlanExercise[]
}

interface WorkoutPlan {
  weeklyPlan: PlanDay[]
  nutritionTips: string[]
  weeklyGoal: string
}

export default function Plan() {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setError('')
    setLoading(true)
    try {
      const res = await api.ai.workoutPlan(notes || undefined)
      setPlan(res)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>План тренировок</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          style={{ flex: 1 }}
          placeholder="Пожелания (необязательно)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <button onClick={generate} disabled={loading}>
          {loading ? 'Генерация...' : 'Сгенерировать'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      {plan && (
        <div>
          <div style={{ background: '#f5f5f5', padding: 12, marginBottom: 16, borderLeft: '4px solid #007bff' }}>
            <strong>Цель недели:</strong> {plan.weeklyGoal}
          </div>

          {plan.weeklyPlan.map((day, i) => (
            <div key={i} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{day.day}</strong>
                <span style={{ color: '#555', fontSize: 13 }}>{day.focus}</span>
              </div>
              <table style={{ width: '100%', marginTop: 8, fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <th style={{ textAlign: 'left', padding: '4px 0' }}>Упражнение</th>
                    <th style={{ textAlign: 'center' }}>Подх.</th>
                    <th style={{ textAlign: 'center' }}>Повт.</th>
                    <th style={{ textAlign: 'center' }}>Отдых</th>
                  </tr>
                </thead>
                <tbody>
                  {day.exercises.map((ex, j) => (
                    <tr key={j} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '4px 0' }}>
                        {ex.name}
                        {ex.notes && <span style={{ color: '#888', marginLeft: 8 }}>({ex.notes})</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>{ex.sets}</td>
                      <td style={{ textAlign: 'center' }}>{ex.reps}</td>
                      <td style={{ textAlign: 'center' }}>{ex.restSec}с</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div style={{ border: '1px solid #ccc', padding: 12 }}>
            <strong>Советы по питанию</strong>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {plan.nutritionTips.map((tip, i) => <li key={i} style={{ fontSize: 13 }}>{tip}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
