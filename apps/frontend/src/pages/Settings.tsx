import { useState } from 'react'
import { ChevronLeft, X, Check, ChevronRight } from 'lucide-react'
import { api } from '../api/client'

const C = { bg: '#0D0D0F', card: '#16161A', card2: '#1E1E26', border: '#2A2A35', orange: '#FF6B35', orangeGlow: 'rgba(255,107,53,0.12)', white: '#FFFFFF', gray: '#8E8EA0', gray2: '#404050', red: '#FF4757' }

interface Props { user: any; onBack: () => void; onUserUpdate: (user: any) => void; onLogout: () => void }

const GOALS = [{ value: 'lose_weight', label: 'Похудение', icon: '🔥' }, { value: 'gain_muscle', label: 'Набор мышц', icon: '💪' }, { value: 'maintain', label: 'Поддержание', icon: '⚖️' }, { value: 'improve_endurance', label: 'Выносливость', icon: '🏃' }, { value: 'flexibility', label: 'Гибкость', icon: '🧘' }]
const LEVELS = [{ value: 'beginner', label: 'Новичок', desc: 'Только начинаю' }, { value: 'intermediate', label: 'Средний', desc: 'Тренируюсь регулярно' }, { value: 'advanced', label: 'Продвинутый', desc: 'Серьёзный опыт' }]
const STYLES = [{ value: 'light', label: 'Мягкий', desc: 'Поддержка и мотивация', icon: '😊' }, { value: 'medium', label: 'Строгий', desc: 'Требователен, но справедлив', icon: '😤' }, { value: 'hard', label: 'Жёсткий', desc: 'Армейский стиль, без жалости', icon: '🔥' }]
const ACTIVITIES = [{ value: 'sedentary', label: 'Сидячий образ жизни' }, { value: 'lightly_active', label: 'Слабая активность' }, { value: 'moderately_active', label: 'Умеренная активность' }, { value: 'very_active', label: 'Высокая активность' }]
const DIETS = [{ value: 'omnivore', label: 'Всеядный' }, { value: 'vegetarian', label: 'Вегетарианец' }, { value: 'vegan', label: 'Веган' }, { value: 'keto', label: 'Кето' }, { value: 'none', label: 'Без ограничений' }]

function Row({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'none', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 15, color: C.white }}>{label}</span>
      <span style={{ fontSize: 14, color: C.orange, display: 'flex', alignItems: 'center', gap: 4 }}>{value} <ChevronRight size={16} /></span>
    </button>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: 1.2, margin: '20px 4px 10px' }}>{title}</div>
      <div style={{ background: C.card, borderRadius: 18, overflow: 'hidden', border: `1px solid ${C.border}` }}>{children}</div>
    </div>
  )
}

function BottomSheet({ title, onClose, onSave, saving, children }: { title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, margin: '0 auto', padding: '20px 20px 32px', maxHeight: '85vh', overflowY: 'auto', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.white }}>{title}</div>
          <button onClick={onClose} style={{ color: C.gray, padding: 0, display: 'flex', alignItems: 'center' }}>
            <X size={22} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
        <button onClick={onSave} disabled={saving} style={{ marginTop: 20, width: '100%', padding: 16, background: C.orange, color: '#fff', borderRadius: 16, fontSize: 16, fontWeight: 700 }}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}

function OptionBtn({ label, desc, icon, selected, onClick }: { label: string; desc?: string; icon?: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: '100%', padding: '13px 16px', borderRadius: 14, textAlign: 'left', background: selected ? C.orangeGlow : C.card2, border: `2px solid ${selected ? C.orange : C.border}`, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
      {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: selected ? C.orange : C.white }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{desc}</div>}
      </div>
      {selected && (
        <div style={{ width: 20, height: 20, borderRadius: 10, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <Check size={12} />
        </div>
      )}
    </button>
  )
}

export default function Settings({ user, onBack, onUserUpdate, onLogout }: Props) {
  const p = user.profile ?? {}
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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

  const labelOf = (arr: { value: string; label: string }[], val: string) => arr.find(x => x.value === val)?.label ?? val

  async function save(fields: object) {
    setSaving(true)
    try { await api.auth.updateProfile(fields); const updated = await api.auth.me(); onUserUpdate(updated); setEditing(null) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 40 }}>
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: C.card2, color: C.white, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.white }}>Настройки</div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ background: C.card, borderRadius: 20, padding: '16px 20px', marginBottom: 16, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 26, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff' }}>
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.white }}>{user.name}</div>
            <div style={{ fontSize: 13, color: C.gray }}>{user.email}</div>
          </div>
        </div>

        <SectionCard title="Тело">
          <Row label="Вес" value={`${p.weightKg} кг`} onClick={() => setEditing('weight')} />
          <Row label="Рост" value={`${p.heightCm} см`} onClick={() => setEditing('height')} />
        </SectionCard>

        <SectionCard title="Фитнес">
          <Row label="Цель" value={labelOf(GOALS, goal)} onClick={() => setEditing('goal')} />
          <Row label="Уровень" value={labelOf(LEVELS, level)} onClick={() => setEditing('level')} />
          <Row label="Активность" value={labelOf(ACTIVITIES, activity)} onClick={() => setEditing('activity')} />
          <Row label="Тренировок в неделю" value={workoutsPerWeek} onClick={() => setEditing('workouts')} />
          <Row label="Травмы" value={injuries || 'нет'} onClick={() => setEditing('injuries')} />
        </SectionCard>

        <SectionCard title="Питание">
          <Row label="Тип питания" value={labelOf(DIETS, diet)} onClick={() => setEditing('diet')} />
        </SectionCard>

        <SectionCard title="Тренер">
          <Row label="Стиль" value={labelOf(STYLES, style)} onClick={() => setEditing('style')} />
        </SectionCard>

        <SectionCard title="Аккаунт">
          <Row label="Имя" value={user.name} onClick={() => setEditing('name')} />
          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, color: C.white }}>Email</span>
            <span style={{ fontSize: 14, color: C.gray }}>{user.email}</span>
          </div>
        </SectionCard>

        <button onClick={onLogout} style={{ width: '100%', marginTop: 8, padding: 16, background: 'rgba(255,71,87,0.1)', color: C.red, border: `1px solid rgba(255,71,87,0.3)`, borderRadius: 16, fontSize: 15, fontWeight: 600 }}>
          Выйти из аккаунта
        </button>
      </div>

      {editing === 'weight' && (
        <BottomSheet title="Вес" onClose={() => setEditing(null)} onSave={() => save({ weightKg: Number(weight) })} saving={saving}>
          <div style={{ background: C.card2, borderRadius: 16, padding: '16px 20px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Вес (кг)</div>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={{ width: '100%', background: 'none', border: 'none', fontSize: 36, fontWeight: 900, color: C.white, padding: 0 }} />
          </div>
        </BottomSheet>
      )}
      {editing === 'height' && (
        <BottomSheet title="Рост" onClose={() => setEditing(null)} onSave={() => save({ heightCm: Number(height) })} saving={saving}>
          <div style={{ background: C.card2, borderRadius: 16, padding: '16px 20px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Рост (см)</div>
            <input type="number" value={height} onChange={e => setHeight(e.target.value)} style={{ width: '100%', background: 'none', border: 'none', fontSize: 36, fontWeight: 900, color: C.white, padding: 0 }} />
          </div>
        </BottomSheet>
      )}
      {editing === 'goal' && <BottomSheet title="Цель" onClose={() => setEditing(null)} onSave={() => save({ goal })} saving={saving}>{GOALS.map(g => <OptionBtn key={g.value} label={g.label} icon={g.icon} selected={goal === g.value} onClick={() => setGoal(g.value)} />)}</BottomSheet>}
      {editing === 'level' && <BottomSheet title="Уровень" onClose={() => setEditing(null)} onSave={() => save({ fitnessLevel: level })} saving={saving}>{LEVELS.map(l => <OptionBtn key={l.value} label={l.label} desc={l.desc} selected={level === l.value} onClick={() => setLevel(l.value)} />)}</BottomSheet>}
      {editing === 'style' && <BottomSheet title="Стиль тренера" onClose={() => setEditing(null)} onSave={() => save({ motivationStyle: style })} saving={saving}>{STYLES.map(s => <OptionBtn key={s.value} label={s.label} desc={s.desc} icon={s.icon} selected={style === s.value} onClick={() => setStyle(s.value)} />)}</BottomSheet>}
      {editing === 'activity' && <BottomSheet title="Активность" onClose={() => setEditing(null)} onSave={() => save({ activityLevel: activity })} saving={saving}>{ACTIVITIES.map(a => <OptionBtn key={a.value} label={a.label} selected={activity === a.value} onClick={() => setActivity(a.value)} />)}</BottomSheet>}
      {editing === 'diet' && <BottomSheet title="Тип питания" onClose={() => setEditing(null)} onSave={() => save({ dietPreference: diet })} saving={saving}>{DIETS.map(d => <OptionBtn key={d.value} label={d.label} selected={diet === d.value} onClick={() => setDiet(d.value)} />)}</BottomSheet>}
      {editing === 'workouts' && (
        <BottomSheet title="Тренировок в неделю" onClose={() => setEditing(null)} onSave={() => save({ workoutsPerWeek: Number(workoutsPerWeek) })} saving={saving}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {[1,2,3,4,5,6,7].map(n => (
              <button key={n} onClick={() => setWorkoutsPerWeek(String(n))} style={{ padding: '14px 0', borderRadius: 12, border: `2px solid ${workoutsPerWeek === String(n) ? C.orange : C.border}`, background: workoutsPerWeek === String(n) ? C.orangeGlow : C.card2, fontSize: 18, fontWeight: 800, color: workoutsPerWeek === String(n) ? C.orange : C.white }}>
                {n}
              </button>
            ))}
          </div>
        </BottomSheet>
      )}
      {editing === 'injuries' && (
        <BottomSheet title="Травмы / ограничения" onClose={() => setEditing(null)} onSave={() => save({ injuries: injuries.split(',').map((s: string) => s.trim()).filter(Boolean) })} saving={saving}>
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 4 }}>Через запятую (или оставь пустым)</div>
          <input value={injuries} onChange={e => setInjuries(e.target.value)} placeholder="колено, поясница..." style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', fontSize: 15, color: C.white, width: '100%' }} />
        </BottomSheet>
      )}
      {editing === 'name' && (
        <BottomSheet title="Имя" onClose={() => setEditing(null)} onSave={async () => { setSaving(true); try { await api.auth.updateProfile({ name } as any); const u = await api.auth.me(); onUserUpdate(u); setEditing(null) } finally { setSaving(false) } }} saving={saving}>
          <input value={name} onChange={e => setName(e.target.value)} style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', fontSize: 18, color: C.white, fontWeight: 700, width: '100%' }} />
        </BottomSheet>
      )}
    </div>
  )
}
