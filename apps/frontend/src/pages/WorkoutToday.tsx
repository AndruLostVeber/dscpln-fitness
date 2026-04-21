import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Dumbbell, Activity, Target, Circle, Zap, Play, Check, ChevronRight, Trophy } from 'lucide-react'
import { api } from '../api/client'

const C = { bg: '#0D0D0F', card: '#16161A', card2: '#1E1E26', border: '#2A2A35', orange: '#FF6B35', orangeGlow: 'rgba(255,107,53,0.15)', white: '#FFFFFF', gray: '#8E8EA0', gray2: '#404050', green: '#4ADE80', red: '#FF4757' }

interface Props { onBack: () => void }

const MUSCLES = [
  { value: 'Грудь', icon: <Dumbbell size={24} /> },
  { value: 'Трицепс', icon: <Dumbbell size={24} /> },
  { value: 'Спина', icon: <Activity size={24} /> },
  { value: 'Бицепс', icon: <Dumbbell size={24} /> },
  { value: 'Ноги', icon: <Activity size={24} /> },
  { value: 'Плечи', icon: <Dumbbell size={24} /> },
  { value: 'Пресс', icon: <Target size={24} /> },
  { value: 'Кардио', icon: <Activity size={24} /> },
  { value: 'Кор', icon: <Circle size={24} /> },
]

const REST_SEC = 90
const TIMER_SPEED = 10

interface Exercise { name: string; sets: number; reps: string }
interface Workout { title: string; duration: string; difficulty: string; exercises: Exercise[] }
interface ChatMsg { role: 'user' | 'assistant'; text: string }

function parseDurationMin(dur: string) { const m = dur.match(/\d+/); return m ? parseInt(m[0]) : 30 }
function parseReps(reps: string) { const m = reps.match(/\d+/); return m ? parseInt(m[0]) : 10 }

function WorkoutSession({ workout, onClose, onComplete }: { workout: Workout; onClose: () => void; onComplete: (w: Workout, done: Exercise[]) => Promise<void> }) {
  const [setsLeft, setSetsLeft] = useState<number[]>(workout.exercises.map(e => e.sets))
  const [timerSec, setTimerSec] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [done, setDone] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<any>(null)
  const restDuration = Math.round(REST_SEC / TIMER_SPEED)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => {
        setTimerSec(prev => { if (prev <= 1) { clearInterval(intervalRef.current); setTimerActive(false); return 0 } return prev - 1 })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [timerActive])

  function doSet(exIdx: number) {
    setSetsLeft(prev => { const next = [...prev]; if (next[exIdx] > 0) next[exIdx]--; return next })
    clearInterval(intervalRef.current)
    setTimerSec(restDuration)
    setTimerActive(true)
  }

  async function sendMessage() {
    if (!input.trim() || sending) return
    const text = input.trim(); setInput('')
    setChat(prev => [...prev, { role: 'user', text }]); setSending(true)
    try {
      const res = await api.ai.chat(`[Тренировка: ${workout.title}] ${text}`)
      setChat(prev => [...prev, { role: 'assistant', text: res.response }])
    } catch { setChat(prev => [...prev, { role: 'assistant', text: 'Ошибка связи с тренером.' }]) }
    finally { setSending(false) }
  }

  async function completeWorkout() {
    setCompleting(true)
    try {
      const completedExercises = workout.exercises.filter((_, i) => setsLeft[i] === 0)
      await onComplete(workout, completedExercises)
      setDone(true)
    }
    finally { setCompleting(false) }
  }

  const totalSetsAll = workout.exercises.reduce((a, e) => a + e.sets, 0)
  const totalDone = totalSetsAll - setsLeft.reduce((a, b) => a + b, 0)
  const completedCount = setsLeft.filter(s => s === 0).length
  const timerPct = restDuration > 0 ? (timerSec / restDuration) * 100 : 0

  if (done) return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Trophy size={72} color={C.orange} />
      <div style={{ fontSize: 26, fontWeight: 900, color: C.white, marginTop: 20, marginBottom: 8 }}>Тренировка завершена!</div>
      <div style={{ fontSize: 15, color: C.gray, marginBottom: 8, textAlign: 'center' }}>{workout.title}</div>
      <div style={{ fontSize: 14, color: C.orange, fontWeight: 700, marginBottom: 40 }}>
        {completedCount} из {workout.exercises.length} упражнений выполнено
      </div>
      <button onClick={onClose} style={{ padding: '16px 48px', background: C.orange, color: '#fff', borderRadius: 18, fontSize: 17, fontWeight: 700 }}>Готово</button>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, zIndex: 200, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ padding: '52px 20px 16px', background: C.card, display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: C.card2, color: C.white, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.white }}>{workout.title}</div>
          <div style={{ fontSize: 12, color: C.gray }}>⏱ {workout.duration} · {workout.difficulty}</div>
        </div>
        <div style={{ background: C.orange, borderRadius: 10, padding: '6px 12px' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{totalDone}/{totalSetsAll}</span>
        </div>
      </div>

      {timerActive && (
        <div style={{ background: C.orange, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Отдых</div>
          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.3)', borderRadius: 3 }}>
            <div style={{ height: 6, background: '#fff', borderRadius: 3, width: `${timerPct}%`, transition: 'width 1s linear' }} />
          </div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 22, minWidth: 36, textAlign: 'right' }}>{timerSec}</div>
          <button onClick={() => { clearInterval(intervalRef.current); setTimerActive(false) }}
            style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 8, padding: '5px 12px', color: '#fff', fontSize: 12, fontWeight: 600 }}>Скип</button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {workout.exercises.map((ex, i) => {
          const left = setsLeft[i]; const isDone = left === 0
          return (
            <div key={i} style={{ background: C.card, borderRadius: 18, padding: '14px 16px', border: `1px solid ${isDone ? C.green + '44' : C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: isDone ? C.gray : C.white, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isDone && <Check size={14} color={C.green} />}{ex.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.gray, marginTop: 3 }}>{ex.reps} повт. · отдых {REST_SEC}с</div>
                </div>
                {!isDone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: C.orange, lineHeight: 1 }}>{left}</div>
                      <div style={{ fontSize: 10, color: C.gray }}>подх.</div>
                    </div>
                    <button onClick={() => doSet(i)} disabled={timerActive} style={{
                      padding: '10px 18px', background: timerActive ? C.card2 : C.orange,
                      color: timerActive ? C.gray : '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700,
                    }}>Сделал</button>
                  </div>
                )}
                {isDone && <Check size={22} color={C.green} />}
              </div>
            </div>
          )
        })}

        <div style={{ background: C.card, borderRadius: 18, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Тренер</div>
          <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 10 }}>
            {chat.length === 0 && <div style={{ fontSize: 13, color: C.gray2, textAlign: 'center', padding: '12px 0' }}>Спроси что угодно во время тренировки</div>}
            {chat.map((m, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: C.gray2, marginBottom: 3 }}>{m.role === 'user' ? 'Ты' : 'Тренер'}</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, borderRadius: 10, padding: '8px 12px', background: m.role === 'user' ? C.card2 : C.orangeGlow, color: m.role === 'user' ? C.white : C.orange }}>{m.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Спросить тренера..."
              style={{ flex: 1, background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: C.white }} />
            <button onClick={sendMessage} disabled={sending || !input.trim()} style={{ padding: '10px 14px', background: C.orange, color: '#fff', borderRadius: 10, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <button onClick={completeWorkout} disabled={completing} style={{ width: '100%', padding: 16, background: C.green, color: '#0D0D0F', borderRadius: 16, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {completing ? 'Сохранение...' : <><Check size={18} /> Завершить тренировку</>}
        </button>
      </div>
    </div>
  )
}

export default function WorkoutToday({ onBack }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [exerciseCount, setExerciseCount] = useState(5)
  const [setsPerExercise, setSetsPerExercise] = useState(3)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSession, setActiveSession] = useState<Workout | null>(null)

  function toggleMuscle(val: string) { setSelected(prev => { const next = new Set(prev); next.has(val) ? next.delete(val) : next.add(val); return next }); setWorkouts([]) }

  async function generate() {
    if (selected.size === 0) return
    setError(''); setLoading(true)
    try {
      const res = await api.ai.workoutSuggestions({ focus: Array.from(selected).join(', '), exerciseCount, setsPerExercise })
      setWorkouts(res.workouts ?? [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function logWorkout(workout: Workout, completedExercises: Exercise[]) {
    if (completedExercises.length === 0) return
    await api.workouts.log({
      title: workout.title,
      durationMin: parseDurationMin(workout.duration),
      exercises: completedExercises.map(ex => ({ name: ex.name, sets: ex.sets, reps: parseReps(ex.reps) })),
    })
  }

  if (activeSession) return <WorkoutSession workout={activeSession} onClose={() => setActiveSession(null)} onComplete={logWorkout} />

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 40 }}>
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: C.card2, color: C.white, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.white }}>Тренировка</div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ fontSize: 12, color: C.gray, marginBottom: 12 }}>Выбери группы мышц</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {MUSCLES.map(m => {
            const active = selected.has(m.value)
            return (
              <button key={m.value} onClick={() => toggleMuscle(m.value)} style={{
                padding: '14px 8px', borderRadius: 16, border: `2px solid ${active ? C.orange : C.border}`,
                background: active ? C.orangeGlow : C.card,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer',
              }}>
                <span style={{ color: active ? C.orange : C.gray }}>{m.icon}</span>
                <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? C.orange : C.gray }}>{m.value}</span>
              </button>
            )
          })}
        </div>

        <div style={{ background: C.card, borderRadius: 20, padding: 16, marginBottom: 16, border: `1px solid ${C.border}` }}>
          {[
            { label: 'Упражнений', value: exerciseCount, min: 2, max: 12, set: setExerciseCount },
            { label: 'Подходов', value: setsPerExercise, min: 1, max: 6, set: setSetsPerExercise },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i === 0 ? 14 : 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{f.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button onClick={() => f.set(v => Math.max(f.min, v - 1))} style={{ width: 34, height: 34, borderRadius: 10, background: C.card2, color: C.white, fontSize: 18, border: `1px solid ${C.border}` }}>−</button>
                <span style={{ fontSize: 22, fontWeight: 900, color: C.orange, minWidth: 28, textAlign: 'center' }}>{f.value}</span>
                <button onClick={() => f.set(v => Math.min(f.max, v + 1))} style={{ width: 34, height: 34, borderRadius: 10, background: C.card2, color: C.white, fontSize: 18, border: `1px solid ${C.border}` }}>+</button>
              </div>
            </div>
          ))}
        </div>

        {selected.size > 0 && <div style={{ fontSize: 13, color: C.orange, marginBottom: 12, fontWeight: 600 }}>{Array.from(selected).join(' · ')}</div>}
        {error && <div style={{ color: C.red, fontSize: 13, marginBottom: 10 }}>{error}</div>}

        <button onClick={generate} disabled={selected.size === 0 || loading} style={{
          width: '100%', padding: '16px', borderRadius: 16, fontSize: 16, fontWeight: 700, marginBottom: 20,
          background: selected.size > 0 ? C.orange : C.card2, color: selected.size > 0 ? '#fff' : C.gray,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {loading ? 'Генерация...' : <><Zap size={18} /> Сгенерировать 2 варианта</>}
        </button>

        {workouts.map((w, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 22, padding: 18, marginBottom: 14, border: `1px solid ${C.border}` }}>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: C.orange, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Вариант {i + 1}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.white, marginBottom: 4 }}>{w.title}</div>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 14 }}>⏱ {w.duration} · {w.difficulty}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {w.exercises.map((ex, j) => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: j < w.exercises.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <span style={{ fontSize: 14, color: C.white }}>{ex.name}</span>
                  <span style={{ fontSize: 13, color: C.gray }}>{ex.sets}×{ex.reps}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveSession(w)} style={{ width: '100%', padding: '14px', background: C.orange, color: '#fff', borderRadius: 14, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Play size={16} /> Начать
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
