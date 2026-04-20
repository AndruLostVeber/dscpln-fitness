import { useState } from 'react'
import { api, clearTokens } from '../api/client'

interface Props {
  user: any
  onBack: () => void
  onUserUpdate: (user: any) => void
  onLogout: () => void
}

const GOALS = [
  { value: 'lose_weight', label: 'Похудение' },
  { value: 'gain_muscle', label: 'Набор мышц' },
  { value: 'maintain', label: 'Поддержание' },
  { value: 'improve_endurance', label: 'Выносливость' },
  { value: 'flexibility', label: 'Гибкость' },
]
const LEVELS = [
  { value: 'beginner', label: 'Новичок' },
  { value: 'intermediate', label: 'Средний' },
  { value: 'advanced', label: 'Продвинутый' },
]
const STYLES = [
  { value: 'light', label: 'Мягкий', desc: 'Подбадривание' },
  { value: 'medium', label: 'Строгий', desc: 'Требователен' },
  { value: 'hard', label: 'Жёсткий', desc: 'Без жалости' },
]
const ACTIVITIES = [
  { value: 'sedentary', label: 'Сидячий образ жизни' },
  { value: 'lightly_active', label: 'Слабая активность' },
  { value: 'moderately_active', label: 'Умеренная активность' },
  { value: 'very_active', label: 'Высокая активность' },
]
const DIETS = [
  { value: 'omnivore', label: 'Всеядный' },
  { value: 'vegetarian', label: 'Вегетарианец' },
  { value: 'vegan', label: 'Веган' },
  { value: 'keto', label: 'Кето' },
  { value: 'none', label: 'Без ограничений' },
]

type Section = 'body' | 'goals' | 'trainer' | 'account'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ fontSize: 15, color: '#222' }}>{label}</div>
      <div style={{ color: '#007bff', fontSize: 15 }}>{children}</div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.8, margin: '20px 4px 8px' }}>
      {children}
    </div>
  )
}

interface EditModalProps {
  title: string
  onClose: () => void
  onSave: () => void
  saving: boolean
  children: React.ReactNode
}

function EditModal({ title, onClose, onSave, saving, children }: EditModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, padding: 24, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: '#aaa', cursor: 'pointer', padding: 0 }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children}
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          style={{ marginTop: 20, width: '100%', padding: 14, background: '#007bff', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}

export default function Settings({ user, onBack, onUserUpdate, onLogout }: Props) {
  const p = user.profile ?? {}
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [weight, setWeight] = useState(String(p.weightKg ?? ''))
  const [height, setHeight] = useState(String(p.heightCm ?? ''))
  const [goal, setGoal] = useState(p.goal ?? 'maintain')
  const [level, setLevel] = useState(p.fitnessLevel ?? 'beginner')
  const [style, setStyle] = useState(p.motivationStyle ?? 'medium')
  const [activity, setActivity] = useState(p.activityLevel ?? 'moderately_active')
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(String(p.workoutsPerWeek ?? '3'))
  const [diet, setDiet] = useState(p.dietPreference ?? 'none')
  const [injuries, setInjuries] = useState((p.injuries ?? []).join(', '))
  const [name, setName] = useState(user.name ?? '')

  async function save(fields: object) {
    setError('')
    setSaving(true)
    try {
      await api.auth.updateProfile(fields)
      const updated = await api.auth.me()
      onUserUpdate(updated)
      setEditing(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const labelOf = (arr: { value: string; label: string }[], val: string) =>
    arr.find(x => x.value === val)?.label ?? val

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', paddingBottom: 40 }}>
      <div style={{ padding: '20px 16px 12px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0 }}>←</button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Настройки</div>
      </div>

      <div style={{ padding: '0 16px' }}>

        <SectionTitle>Тело</SectionTitle>
        <Card>
          <Row label="Вес"><button onClick={() => setEditing('weight')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: 15 }}>{p.weightKg} кг ›</button></Row>
          <Row label="Рост"><button onClick={() => setEditing('height')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: 15 }}>{p.heightCm} см ›</button></Row>
        </Card>

        <SectionTitle>Фитнес</SectionTitle>
        <Card>
          <Row label="Цель"><button onClick={() => setEditing('goal')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: 15 }}>{labelOf(GOALS, goal)} ›</button></Row>
          <Row label="Уровень"><button onClick={() => setEditing('level')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: 15 }}>{labelOf(LEVELS, level)} ›</button></Row>
          <Row label="Активность"><button onClick={() => setEditing('activity')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: 15 }}>{labelOf(ACTIVITIES, activity)} ›</button></Row>
          <Row label="Тренировок в неделю"><button onClick={() => setEditing('workouts')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: 15 }}>{workoutsPerWeek} ›</button></Row>
          <Row label="Травмы"><button onClick={() => setEditing('injuries')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: 15 }}>{injuries || 'нет'} ›</button></Row>
        </Card>

        <SectionTitle>Питание</SectionTitle>
        <Card>
          <Row label="Тип питания"><button onClick={() => setEditing('diet')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: 15 }}>{labelOf(DIETS, diet)} ›</button></Row>
        </Card>

        <SectionTitle>Тренер</SectionTitle>
        <Card>
          <Row label="Стиль тренера"><button onClick={() => setEditing('style')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: 15 }}>{labelOf(STYLES, style)} ›</button></Row>
        </Card>

        <SectionTitle>Аккаунт</SectionTitle>
        <Card>
          <Row label="Имя"><button onClick={() => setEditing('name')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: 15 }}>{user.name} ›</button></Row>
          <Row label="Email"><span style={{ color: '#aaa', fontSize: 14 }}>{user.email}</span></Row>
        </Card>

        {error && <div style={{ color: 'red', fontSize: 13, margin: '8px 0' }}>{error}</div>}

        <button
          onClick={onLogout}
          style={{ width: '100%', marginTop: 8, padding: 14, background: '#fff', color: '#ff4444', border: '1px solid #ffd0d0', borderRadius: 12, fontSize: 15, cursor: 'pointer' }}>
          Выйти из аккаунта
        </button>
      </div>

      {editing === 'weight' && (
        <EditModal title="Вес" onClose={() => setEditing(null)} onSave={() => save({ weightKg: Number(weight) })} saving={saving}>
          <label style={{ fontSize: 14, color: '#555' }}>Вес (кг)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', fontSize: 16 }} />
        </EditModal>
      )}

      {editing === 'height' && (
        <EditModal title="Рост" onClose={() => setEditing(null)} onSave={() => save({ heightCm: Number(height) })} saving={saving}>
          <label style={{ fontSize: 14, color: '#555' }}>Рост (см)</label>
          <input type="number" value={height} onChange={e => setHeight(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', fontSize: 16 }} />
        </EditModal>
      )}

      {editing === 'goal' && (
        <EditModal title="Цель" onClose={() => setEditing(null)} onSave={() => save({ goal })} saving={saving}>
          {GOALS.map(g => (
            <button key={g.value} onClick={() => setGoal(g.value)} style={{ padding: '13px 16px', borderRadius: 10, border: `2px solid ${goal === g.value ? '#007bff' : '#eee'}`, background: goal === g.value ? '#f0f6ff' : '#fff', fontSize: 15, cursor: 'pointer', textAlign: 'left', fontWeight: goal === g.value ? 600 : 400 }}>
              {g.label}
            </button>
          ))}
        </EditModal>
      )}

      {editing === 'level' && (
        <EditModal title="Уровень подготовки" onClose={() => setEditing(null)} onSave={() => save({ fitnessLevel: level })} saving={saving}>
          {LEVELS.map(l => (
            <button key={l.value} onClick={() => setLevel(l.value)} style={{ padding: '13px 16px', borderRadius: 10, border: `2px solid ${level === l.value ? '#007bff' : '#eee'}`, background: level === l.value ? '#f0f6ff' : '#fff', fontSize: 15, cursor: 'pointer', textAlign: 'left', fontWeight: level === l.value ? 600 : 400 }}>
              {l.label}
            </button>
          ))}
        </EditModal>
      )}

      {editing === 'style' && (
        <EditModal title="Стиль тренера" onClose={() => setEditing(null)} onSave={() => save({ motivationStyle: style })} saving={saving}>
          {STYLES.map(s => (
            <button key={s.value} onClick={() => setStyle(s.value)} style={{ padding: '13px 16px', borderRadius: 10, border: `2px solid ${style === s.value ? '#007bff' : '#eee'}`, background: style === s.value ? '#f0f6ff' : '#fff', fontSize: 15, cursor: 'pointer', textAlign: 'left', fontWeight: style === s.value ? 600 : 400 }}>
              <div>{s.label}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.desc}</div>
            </button>
          ))}
        </EditModal>
      )}

      {editing === 'activity' && (
        <EditModal title="Активность" onClose={() => setEditing(null)} onSave={() => save({ activityLevel: activity })} saving={saving}>
          {ACTIVITIES.map(a => (
            <button key={a.value} onClick={() => setActivity(a.value)} style={{ padding: '13px 16px', borderRadius: 10, border: `2px solid ${activity === a.value ? '#007bff' : '#eee'}`, background: activity === a.value ? '#f0f6ff' : '#fff', fontSize: 15, cursor: 'pointer', textAlign: 'left', fontWeight: activity === a.value ? 600 : 400 }}>
              {a.label}
            </button>
          ))}
        </EditModal>
      )}

      {editing === 'workouts' && (
        <EditModal title="Тренировок в неделю" onClose={() => setEditing(null)} onSave={() => save({ workoutsPerWeek: Number(workoutsPerWeek) })} saving={saving}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {[1,2,3,4,5,6,7].map(n => (
              <button key={n} onClick={() => setWorkoutsPerWeek(String(n))} style={{ padding: '12px 0', borderRadius: 10, border: `2px solid ${workoutsPerWeek === String(n) ? '#007bff' : '#eee'}`, background: workoutsPerWeek === String(n) ? '#f0f6ff' : '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                {n}
              </button>
            ))}
          </div>
        </EditModal>
      )}

      {editing === 'diet' && (
        <EditModal title="Тип питания" onClose={() => setEditing(null)} onSave={() => save({ dietPreference: diet })} saving={saving}>
          {DIETS.map(d => (
            <button key={d.value} onClick={() => setDiet(d.value)} style={{ padding: '13px 16px', borderRadius: 10, border: `2px solid ${diet === d.value ? '#007bff' : '#eee'}`, background: diet === d.value ? '#f0f6ff' : '#fff', fontSize: 15, cursor: 'pointer', textAlign: 'left', fontWeight: diet === d.value ? 600 : 400 }}>
              {d.label}
            </button>
          ))}
        </EditModal>
      )}

      {editing === 'injuries' && (
        <EditModal title="Травмы / ограничения" onClose={() => setEditing(null)} onSave={() => save({ injuries: injuries.split(',').map(s => s.trim()).filter(Boolean) })} saving={saving}>
          <label style={{ fontSize: 14, color: '#555' }}>Через запятую (или оставь пустым)</label>
          <input value={injuries} onChange={e => setInjuries(e.target.value)} placeholder="колено, поясница..." style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', fontSize: 15 }} />
        </EditModal>
      )}

      {editing === 'name' && (
        <EditModal title="Имя" onClose={() => setEditing(null)} onSave={async () => { setError(''); setSaving(true); try { await api.auth.updateProfile({ name } as any); const u = await api.auth.me(); onUserUpdate(u); setEditing(null) } catch(e:any){setError(e.message)} finally{setSaving(false)} }} saving={saving}>
          <input value={name} onChange={e => setName(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', fontSize: 16 }} />
        </EditModal>
      )}
    </div>
  )
}
