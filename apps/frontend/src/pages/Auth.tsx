import { useState } from 'react'
import { api, saveTokens } from '../api/client'

interface Props {
  onAuth: () => void
}

const GOALS = ['lose_weight', 'gain_muscle', 'maintain', 'improve_endurance', 'flexibility']
const LEVELS = ['beginner', 'intermediate', 'advanced']
const STYLES = ['light', 'medium', 'hard']
const GENDERS = ['male', 'female', 'other']

export default function Auth({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    email: '', password: '', name: '',
    dateOfBirth: '', gender: 'male', heightCm: 170, weightKg: 70,
    goal: 'gain_muscle', fitnessLevel: 'beginner', motivationStyle: 'medium',
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const res = await api.auth.login({ email: form.email, password: form.password })
        saveTokens(res.accessToken, res.refreshToken)
      } else {
        const res = await api.auth.register({
          ...form,
          heightCm: Number(form.heightCm),
          weightKg: Number(form.weightKg),
        })
        saveTokens(res.accessToken, res.refreshToken)
      }
      onAuth()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 24, border: '1px solid #ccc' }}>
      <h2>{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input placeholder="Email" value={form.email} onChange={e => set('email', e.target.value)} required />
        <input placeholder="Пароль" type="password" value={form.password} onChange={e => set('password', e.target.value)} required />

        {mode === 'register' && <>
          <input placeholder="Имя" value={form.name} onChange={e => set('name', e.target.value)} required />
          <input placeholder="Дата рождения" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} required />

          <select value={form.gender} onChange={e => set('gender', e.target.value)}>
            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <input placeholder="Рост (см)" type="number" value={form.heightCm} onChange={e => set('heightCm', e.target.value)} required />
          <input placeholder="Вес (кг)" type="number" value={form.weightKg} onChange={e => set('weightKg', e.target.value)} required />

          <select value={form.goal} onChange={e => set('goal', e.target.value)}>
            {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <select value={form.fitnessLevel} onChange={e => set('fitnessLevel', e.target.value)}>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          <label>Стиль тренера:</label>
          <select value={form.motivationStyle} onChange={e => set('motivationStyle', e.target.value)}>
            {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </>}

        {error && <div style={{ color: 'red', fontSize: 13 }}>{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      <button style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
        {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
      </button>
    </div>
  )
}
