import { useState, useEffect } from 'react'
import { api } from '../api/client'

interface Exercise {
  name: string
  sets: number
  reps?: number
  weightKg?: number
  durationSec?: number
  notes?: string
}

interface Session {
  id: string
  title: string
  durationMin: number
  notes?: string
  createdAt: string
  exercises: Exercise[]
}

const emptyExercise = (): Exercise => ({ name: '', sets: 3, reps: 10 })

export default function Workouts() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([emptyExercise()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try { setSessions(await api.workouts.list()) } catch {}
  }

  function setEx(i: number, k: string, v: any) {
    setExercises(ex => ex.map((e, idx) => idx === i ? { ...e, [k]: v } : e))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.workouts.log({
        title,
        durationMin: Number(duration),
        notes: notes || undefined,
        exercises: exercises.map(ex => ({
          ...ex,
          sets: Number(ex.sets),
          reps: ex.reps ? Number(ex.reps) : undefined,
          weightKg: ex.weightKg ? Number(ex.weightKg) : undefined,
        })),
      })
      setShowForm(false)
      setTitle(''); setDuration(60); setNotes(''); setExercises([emptyExercise()])
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function del(id: string) {
    if (!confirm('Удалить тренировку?')) return
    await api.workouts.delete(id)
    setSessions(s => s.filter(x => x.id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Тренировки</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отмена' : '+ Добавить'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ border: '1px solid #ccc', padding: 16, marginBottom: 16 }}>
          <h3>Новая тренировка</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input placeholder="Название" value={title} onChange={e => setTitle(e.target.value)} required />
            <input placeholder="Длительность (мин)" type="number" value={duration} onChange={e => setDuration(+e.target.value)} required />
            <input placeholder="Заметки" value={notes} onChange={e => setNotes(e.target.value)} />

            <h4>Упражнения</h4>
            {exercises.map((ex, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: 6 }}>
                <input placeholder="Упражнение" value={ex.name} onChange={e => setEx(i, 'name', e.target.value)} required style={{ width: 150 }} />
                <input placeholder="Подходы" type="number" value={ex.sets} onChange={e => setEx(i, 'sets', e.target.value)} style={{ width: 70 }} />
                <input placeholder="Повторы" type="number" value={ex.reps ?? ''} onChange={e => setEx(i, 'reps', e.target.value)} style={{ width: 70 }} />
                <input placeholder="Вес кг" type="number" step="0.5" value={ex.weightKg ?? ''} onChange={e => setEx(i, 'weightKg', e.target.value)} style={{ width: 70 }} />
                {exercises.length > 1 && (
                  <button type="button" onClick={() => setExercises(ex => ex.filter((_, idx) => idx !== i))}>✕</button>
                )}
              </div>
            ))}

            <button type="button" onClick={() => setExercises(ex => [...ex, emptyExercise()])}>+ Упражнение</button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
          </div>
        </form>
      )}

      {sessions.length === 0 && !showForm && <p style={{ color: '#888' }}>Тренировок пока нет</p>}

      {sessions.map(s => (
        <div key={s.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{s.title}</strong>
            <button onClick={() => del(s.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>Удалить</button>
          </div>
          <div style={{ fontSize: 13, color: '#555' }}>
            {new Date(s.createdAt).toLocaleDateString('ru')} · {s.durationMin} мин · {s.exercises.length} упражнений
          </div>
          {s.notes && <div style={{ fontSize: 13, marginTop: 4 }}>{s.notes}</div>}
          <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 13 }}>
            {s.exercises.map((ex, i) => (
              <li key={i}>
                {ex.name} — {ex.sets}×{ex.reps ?? '?'}
                {ex.weightKg ? ` @ ${ex.weightKg}кг` : ''}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
