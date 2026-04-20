import { useState } from 'react'
import { api, saveTokens } from '../api/client'

interface Props {
  onAuth: () => void
}

const GOALS: { value: string; label: string }[] = [
  { value: 'lose_weight', label: 'Похудение' },
  { value: 'gain_muscle', label: 'Набор мышечной массы' },
  { value: 'maintain', label: 'Поддержание формы' },
  { value: 'improve_endurance', label: 'Выносливость' },
  { value: 'flexibility', label: 'Гибкость' },
]
const LEVELS: { value: string; label: string }[] = [
  { value: 'beginner', label: 'Новичок' },
  { value: 'intermediate', label: 'Средний' },
  { value: 'advanced', label: 'Продвинутый' },
]
const STYLES: { value: string; label: string; desc: string }[] = [
  { value: 'light', label: 'Мягкий', desc: 'Подбадривание и поддержка' },
  { value: 'medium', label: 'Строгий', desc: 'Требователен, но справедлив' },
  { value: 'hard', label: 'Жёсткий', desc: 'Армейский стиль, без жалости' },
]
const GENDERS: { value: string; label: string }[] = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
  { value: 'other', label: 'Другой' },
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

const s: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const cardBtn: React.CSSProperties = {
  padding: '14px 20px',
  border: '1px solid #ccc',
  borderRadius: 8,
  background: '#fff',
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: 15,
}

const cardBtnSelected: React.CSSProperties = {
  ...cardBtn,
  border: '2px solid #007bff',
  background: '#f0f6ff',
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
  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100)

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
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function submitRegister() {
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.register({
        email: form.email,
        password: form.password,
        name: form.name,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        goal: form.goal,
        fitnessLevel: form.fitnessLevel,
        motivationStyle: form.motivationStyle,
      })
      saveTokens(res.accessToken, res.refreshToken)
      onAuth()
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  if (mode === 'login') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <div style={{ width: 360, padding: 32 }}>
          <h2 style={{ marginBottom: 24 }}>Вход</h2>
          <form onSubmit={submitLogin} style={s}>
            <input placeholder="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
            <input placeholder="Пароль" type="password" value={form.password} onChange={e => set('password', e.target.value)} required />
            {error && <div style={{ color: 'red', fontSize: 13 }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ background: '#007bff', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, fontSize: 15 }}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
          <button style={{ marginTop: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#007bff', fontSize: 14 }}
            onClick={() => { setMode('register'); setStep('credentials'); setError('') }}>
            Нет аккаунта? Зарегистрироваться
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
      <div style={{ width: 400, padding: 32 }}>

        <div style={{ marginBottom: 8, fontSize: 13, color: '#888' }}>
          Шаг {stepIndex + 1} из {STEPS.length}
        </div>
        <div style={{ height: 4, background: '#eee', borderRadius: 2, marginBottom: 28 }}>
          <div style={{ height: 4, background: '#007bff', borderRadius: 2, width: `${progress}%`, transition: 'width 0.3s' }} />
        </div>

        <h2 style={{ marginBottom: 24 }}>{STEP_TITLES[step]}</h2>

        {step === 'credentials' && (
          <div style={s}>
            <input placeholder="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            <input placeholder="Пароль" type="password" value={form.password} onChange={e => set('password', e.target.value)} />
            <input placeholder="Повторите пароль" type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
          </div>
        )}

        {step === 'name' && (
          <div style={s}>
            <input placeholder="Ваше имя" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
          </div>
        )}

        {step === 'dob' && (
          <div style={s}>
            <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
          </div>
        )}

        {step === 'gender' && (
          <div style={s}>
            {GENDERS.map(g => (
              <button key={g.value} type="button"
                style={form.gender === g.value ? cardBtnSelected : cardBtn}
                onClick={() => set('gender', g.value)}>
                {g.label}
              </button>
            ))}
          </div>
        )}

        {step === 'body' && (
          <div style={s}>
            <label style={{ fontSize: 14, color: '#555' }}>Рост (см)</label>
            <input type="number" placeholder="например, 180" value={form.heightCm} onChange={e => set('heightCm', e.target.value)} />
            <label style={{ fontSize: 14, color: '#555' }}>Вес (кг)</label>
            <input type="number" placeholder="например, 75" value={form.weightKg} onChange={e => set('weightKg', e.target.value)} />
          </div>
        )}

        {step === 'goal' && (
          <div style={s}>
            {GOALS.map(g => (
              <button key={g.value} type="button"
                style={form.goal === g.value ? cardBtnSelected : cardBtn}
                onClick={() => set('goal', g.value)}>
                {g.label}
              </button>
            ))}
          </div>
        )}

        {step === 'level' && (
          <div style={s}>
            {LEVELS.map(l => (
              <button key={l.value} type="button"
                style={form.fitnessLevel === l.value ? cardBtnSelected : cardBtn}
                onClick={() => set('fitnessLevel', l.value)}>
                {l.label}
              </button>
            ))}
          </div>
        )}

        {step === 'style' && (
          <div style={s}>
            {STYLES.map(st => (
              <button key={st.value} type="button"
                style={form.motivationStyle === st.value ? cardBtnSelected : cardBtn}
                onClick={() => set('motivationStyle', st.value)}>
                <div style={{ fontWeight: 600 }}>{st.label}</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{st.desc}</div>
              </button>
            ))}
          </div>
        )}

        {error && <div style={{ color: 'red', fontSize: 13, marginTop: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {stepIndex > 0 && (
            <button onClick={back} style={{ flex: 1, padding: 10, borderRadius: 6 }}>
              Назад
            </button>
          )}
          <button
            onClick={next}
            disabled={loading}
            style={{ flex: 2, padding: 10, background: '#007bff', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15 }}>
            {loading ? 'Загрузка...' : step === 'style' ? 'Готово' : 'Далее'}
          </button>
        </div>

        {stepIndex === 0 && (
          <button style={{ marginTop: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#007bff', fontSize: 14 }}
            onClick={() => { setMode('login'); setError('') }}>
            Уже есть аккаунт? Войти
          </button>
        )}
      </div>
    </div>
  )
}
