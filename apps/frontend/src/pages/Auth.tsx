import { useState } from 'react'
import { ChevronLeft, Check, Zap, Rocket, ChevronRight } from 'lucide-react'
import { api, saveTokens } from '../api/client'

const C = {
  bg: '#0D0D0F',
  card: '#16161A',
  card2: '#1E1E26',
  border: '#2A2A35',
  orange: '#FF6B35',
  orangeGlow: 'rgba(255,107,53,0.15)',
  white: '#FFFFFF',
  gray: '#8E8EA0',
  gray2: '#404050',
}

interface Props { onAuth: () => void }

const GOALS = [
  { value: 'lose_weight', label: 'Похудение', icon: '🔥' },
  { value: 'gain_muscle', label: 'Набор мышц', icon: '💪' },
  { value: 'maintain', label: 'Поддержание формы', icon: '⚖️' },
  { value: 'improve_endurance', label: 'Выносливость', icon: '🏃' },
  { value: 'flexibility', label: 'Гибкость', icon: '🧘' },
]
const LEVELS = [
  { value: 'beginner', label: 'Новичок', desc: 'Только начинаю' },
  { value: 'intermediate', label: 'Средний', desc: 'Тренируюсь регулярно' },
  { value: 'advanced', label: 'Продвинутый', desc: 'Серьёзный опыт' },
]
const STYLES = [
  { value: 'light', label: 'Мягкий', desc: 'Поддержка и мотивация', icon: '😊' },
  { value: 'medium', label: 'Строгий', desc: 'Требователен, но справедлив', icon: '😤' },
  { value: 'hard', label: 'Жёсткий', desc: 'Армейский стиль, без жалости', icon: '🔥' },
]
const GENDERS = [
  { value: 'male', label: 'Мужской', icon: '♂' },
  { value: 'female', label: 'Женский', icon: '♀' },
  { value: 'other', label: 'Другой', icon: '○' },
]

type Step = 'credentials' | 'name' | 'dob' | 'gender' | 'body' | 'goal' | 'level' | 'style'
const STEPS: Step[] = ['credentials', 'name', 'dob', 'gender', 'body', 'goal', 'level', 'style']
const STEP_TITLES: Record<Step, string> = {
  credentials: 'Создайте аккаунт',
  name: 'Как вас зовут?',
  dob: 'Дата рождения',
  gender: 'Ваш пол',
  body: 'Параметры тела',
  goal: 'Ваша цель',
  level: 'Уровень подготовки',
  style: 'Стиль тренера',
}

function Input({ placeholder, type = 'text', value, onChange }: { placeholder: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '14px 16px', background: C.card2, border: `1px solid ${C.border}`, borderRadius: 14, fontSize: 15, color: C.white }}
    />
  )
}

function OptionBtn({ label, desc, icon, selected, onClick }: { label: string; desc?: string; icon?: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '14px 16px', borderRadius: 14, textAlign: 'left',
      background: selected ? C.orangeGlow : C.card2,
      border: `2px solid ${selected ? C.orange : C.border}`,
      display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
    }}>
      {icon && <span style={{ fontSize: 22 }}>{icon}</span>}
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: selected ? C.orange : C.white }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{desc}</div>}
      </div>
      {selected && (
        <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: 10, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
          <Check size={12} />
        </div>
      )}
    </button>
  )
}

export default function Auth({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [step, setStep] = useState<Step>('credentials')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '', name: '',
    dateOfBirth: '', gender: 'male', heightCm: '', weightKg: '',
    goal: '', fitnessLevel: '', motivationStyle: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  function validateStep(): string {
    if (step === 'credentials') {
      if (!form.email.includes('@')) return 'Введите корректный email'
      if (form.password.length < 8) return 'Пароль минимум 8 символов'
      if (form.password !== form.confirmPassword) return 'Пароли не совпадают'
    }
    if (step === 'name' && !form.name.trim()) return 'Введите имя'
    if (step === 'dob' && !form.dateOfBirth) return 'Выберите дату рождения'
    if (step === 'body') {
      if (!form.heightCm || +form.heightCm < 100 || +form.heightCm > 250) return 'Рост: 100–250 см'
      if (!form.weightKg || +form.weightKg < 30 || +form.weightKg > 300) return 'Вес: 30–300 кг'
    }
    if (step === 'goal' && !form.goal) return 'Выберите цель'
    if (step === 'level' && !form.fitnessLevel) return 'Выберите уровень'
    if (step === 'style' && !form.motivationStyle) return 'Выберите стиль'
    return ''
  }

  function next() {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
    else submitRegister()
  }

  function back() {
    setError('')
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.login({ email: form.email, password: form.password })
      saveTokens(res.accessToken, res.refreshToken)
      onAuth()
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function submitRegister() {
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.register({
        email: form.email, password: form.password, name: form.name,
        dateOfBirth: form.dateOfBirth, gender: form.gender,
        heightCm: Number(form.heightCm), weightKg: Number(form.weightKg),
        goal: form.goal, fitnessLevel: form.fitnessLevel, motivationStyle: form.motivationStyle,
      })
      saveTokens(res.accessToken, res.refreshToken)
      onAuth()
    } catch (e: any) { setError(e.message); setLoading(false) }
  }

  if (mode === 'login') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <Zap size={48} color={C.orange} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.white }}>Fitness AI</div>
            <div style={{ fontSize: 14, color: C.gray, marginTop: 6 }}>Твой персональный тренер</div>
          </div>

          <form onSubmit={submitLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input placeholder="Email" type="email" value={form.email} onChange={v => set('email', v)} />
            <Input placeholder="Пароль" type="password" value={form.password} onChange={v => set('password', v)} />
            {error && <div style={{ color: '#FF4757', fontSize: 13, textAlign: 'center' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{
              marginTop: 8, padding: '16px', background: C.orange, color: '#fff',
              borderRadius: 16, fontSize: 16, fontWeight: 700,
            }}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <button onClick={() => { setMode('register'); setStep('credentials'); setError('') }}
            style={{ marginTop: 20, width: '100%', color: C.gray, fontSize: 14, textAlign: 'center' }}>
            Нет аккаунта? <span style={{ color: C.orange, fontWeight: 600 }}>Зарегистрироваться</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', padding: '0 24px' }}>
      <div style={{ paddingTop: 60, width: '100%', maxWidth: 420, margin: '0 auto', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          {stepIndex > 0 && (
            <button onClick={back} style={{ width: 36, height: 36, borderRadius: 10, background: C.card2, color: C.white, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={20} />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ height: 4, background: C.card2, borderRadius: 2 }}>
              <div style={{ height: 4, background: C.orange, borderRadius: 2, width: `${progress}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.gray, whiteSpace: 'nowrap' }}>{stepIndex + 1}/{STEPS.length}</div>
        </div>

        <div style={{ fontSize: 26, fontWeight: 800, color: C.white, marginBottom: 8 }}>{STEP_TITLES[step]}</div>
        <div style={{ fontSize: 14, color: C.gray, marginBottom: 28 }}>
          {step === 'credentials' && 'Заполните данные для входа'}
          {step === 'name' && 'Как нам к вам обращаться?'}
          {step === 'dob' && 'Нужно для расчёта нормы калорий'}
          {step === 'gender' && 'Влияет на расчёт метаболизма'}
          {step === 'body' && 'Нужно для точного расчёта КБЖУ'}
          {step === 'goal' && 'Под что подстроим программу'}
          {step === 'level' && 'Подберём подходящие упражнения'}
          {step === 'style' && 'Как тренер будет с вами общаться'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {step === 'credentials' && <>
            <Input placeholder="Email" type="email" value={form.email} onChange={v => set('email', v)} />
            <Input placeholder="Пароль" type="password" value={form.password} onChange={v => set('password', v)} />
            <Input placeholder="Повторите пароль" type="password" value={form.confirmPassword} onChange={v => set('confirmPassword', v)} />
          </>}

          {step === 'name' && <Input placeholder="Ваше имя" value={form.name} onChange={v => set('name', v)} />}

          {step === 'dob' && (
            <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)}
              style={{ width: '100%', padding: '14px 16px', background: C.card2, border: `1px solid ${C.border}`, borderRadius: 14, fontSize: 15, color: C.white }} />
          )}

          {step === 'gender' && GENDERS.map(g => (
            <OptionBtn key={g.value} label={g.label} icon={g.icon} selected={form.gender === g.value} onClick={() => set('gender', g.value)} />
          ))}

          {step === 'body' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Рост', key: 'heightCm', placeholder: '180', unit: 'см' },
                { label: 'Вес', key: 'weightKg', placeholder: '75', unit: 'кг' },
              ].map(f => (
                <div key={f.key} style={{ background: C.card2, borderRadius: 16, padding: '16px', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{f.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <input type="number" placeholder={f.placeholder}
                      value={form[f.key as keyof typeof form]}
                      onChange={e => set(f.key, e.target.value)}
                      style={{ width: '100%', background: 'none', border: 'none', fontSize: 28, fontWeight: 800, color: C.white, padding: 0 }} />
                    <span style={{ fontSize: 14, color: C.gray }}>{f.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 'goal' && GOALS.map(g => (
            <OptionBtn key={g.value} label={g.label} icon={g.icon} selected={form.goal === g.value} onClick={() => set('goal', g.value)} />
          ))}

          {step === 'level' && LEVELS.map(l => (
            <OptionBtn key={l.value} label={l.label} desc={l.desc} selected={form.fitnessLevel === l.value} onClick={() => set('fitnessLevel', l.value)} />
          ))}

          {step === 'style' && STYLES.map(s => (
            <OptionBtn key={s.value} label={s.label} desc={s.desc} icon={s.icon} selected={form.motivationStyle === s.value} onClick={() => set('motivationStyle', s.value)} />
          ))}
        </div>

        {error && <div style={{ color: '#FF4757', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</div>}

        <button onClick={next} disabled={loading} style={{
          marginTop: 28, width: '100%', padding: '16px',
          background: C.orange, color: '#fff', borderRadius: 16, fontSize: 16, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {loading ? 'Загрузка...' : step === 'style'
            ? <><Rocket size={18} /> Начать</>
            : <>Далее <ChevronRight size={18} /></>
          }
        </button>

        {stepIndex === 0 && (
          <button onClick={() => { setMode('login'); setError('') }}
            style={{ marginTop: 16, width: '100%', color: C.gray, fontSize: 14, textAlign: 'center' }}>
            Уже есть аккаунт? <span style={{ color: C.orange, fontWeight: 600 }}>Войти</span>
          </button>
        )}
      </div>
    </div>
  )
}
