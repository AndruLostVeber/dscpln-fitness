import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { api } from '../api/client'

const C = { bg: '#0D0D0F', card: '#16161A', card2: '#1E1E26', border: '#2A2A35', orange: '#FF6B35', white: '#FFFFFF', gray: '#8E8EA0', gray2: '#404050', green: '#4ADE80' }

interface Props { onBack: () => void }
interface WorkoutSession { id: string; title: string; durationMin: number; createdAt: string; exercises: { name: string; sets: number }[] }

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

function toDateKey(date: Date) { return date.toISOString().split('T')[0] }

export default function WorkoutCalendar({ onBack }: Props) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  useEffect(() => {
    api.workouts.list().then(setSessions).catch(() => setSessions([])).finally(() => setLoading(false))
  }, [])

  const workoutMap = sessions.reduce<Record<string, WorkoutSession[]>>((acc, s) => {
    const key = toDateKey(new Date(s.createdAt))
    acc[key] = acc[key] ? [...acc[key], s] : [s]
    return acc
  }, {})

  function prevMonth() { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1) }
  function nextMonth() { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1) }

  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay = new Date(viewYear, viewMonth + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const cells = Array.from({ length: Math.ceil((startOffset + lastDay.getDate()) / 7) * 7 }, (_, i) => { const d = i - startOffset + 1; return (d < 1 || d > lastDay.getDate()) ? null : d })

  const selectedSessions = selectedDay ? workoutMap[selectedDay] ?? [] : []
  const todayKey = toDateKey(today)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 40 }}>
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: C.card2, color: C.white, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.white }}>Календарь</div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {sessions.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, background: C.card, borderRadius: 16, padding: '14px 16px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: C.orange }}>{sessions.length}</div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>Всего тренировок</div>
            </div>
            <div style={{ flex: 1, background: C.card, borderRadius: 16, padding: '14px 16px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: C.green }}>{Object.keys(workoutMap).length}</div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>Активных дней</div>
            </div>
          </div>
        )}

        <div style={{ background: C.card, borderRadius: 24, padding: 16, marginBottom: 16, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 10, background: C.card2, color: C.white, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.white }}>{MONTHS[viewMonth]} {viewYear}</div>
            <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 10, background: C.card2, color: C.white, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
            {WEEKDAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, color: C.gray2, padding: '4px 0', fontWeight: 600 }}>{d}</div>)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const hasWorkout = !!workoutMap[key]
              const isToday = key === todayKey
              const isSelected = key === selectedDay
              return (
                <button key={i} onClick={() => setSelectedDay(isSelected ? null : key)} style={{
                  padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                  background: isSelected ? C.orange : isToday ? C.card2 : 'transparent',
                  border: isToday && !isSelected ? `1px solid ${C.orange}` : '1px solid transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}>
                  <span style={{ fontSize: 14, fontWeight: isToday || isSelected ? 800 : 400, color: isSelected ? '#fff' : isToday ? C.orange : C.white }}>{day}</span>
                  {hasWorkout && <div style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#fff' : C.green }} />}
                </button>
              )
            })}
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', color: C.gray, padding: 20 }}>Загрузка...</div>}

        {selectedDay && (
          <div>
            <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </div>
            {selectedSessions.length === 0
              ? <div style={{ background: C.card, borderRadius: 16, padding: 20, textAlign: 'center', color: C.gray, fontSize: 14, border: `1px solid ${C.border}` }}>В этот день тренировок нет</div>
              : selectedSessions.map(s => (
                <div key={s.id} style={{ background: C.card, borderRadius: 18, padding: 16, marginBottom: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.white }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: C.orange, marginTop: 4, fontWeight: 600 }}>⏱ {s.durationMin} мин</div>
                    </div>
                    <div style={{ fontSize: 12, color: C.gray }}>{new Date(s.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  {s.exercises && s.exercises.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {s.exercises.map((ex, i) => (
                        <div key={i} style={{ background: C.card2, borderRadius: 8, padding: '5px 10px', fontSize: 12, color: C.gray, border: `1px solid ${C.border}` }}>
                          {ex.name} × {ex.sets}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {!selectedDay && !loading && sessions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.gray }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Calendar size={48} color={C.gray} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.white, marginBottom: 8 }}>Тренировок пока нет</div>
            <div style={{ fontSize: 14 }}>Начни первую тренировку!</div>
          </div>
        )}
      </div>
    </div>
  )
}
