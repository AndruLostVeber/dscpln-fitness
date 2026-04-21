import { useState } from 'react'
import { ChevronLeft, X, Check, ShoppingCart, ChefHat, Sparkles, RefreshCw, ChevronRight, Flame, Plus } from 'lucide-react'
import { api } from '../api/client'

const C = {
  bg: '#0D0D0F', card: '#16161A', card2: '#1E1E26',
  border: '#2A2A35', orange: '#FF6B35', orangeGlow: 'rgba(255,107,53,0.12)',
  white: '#FFFFFF', gray: '#8E8EA0', gray2: '#404050',
  green: '#4ADE80', red: '#FF4757', blue: '#4FC3F7',
}

interface FoodItem {
  name: string; description: string; calories: number
  protein: number; fat: number; carbs: number
  ingredients?: string[]; recipe?: string[]
}

interface Props {
  user: any; eaten: FoodItem[]; onEat: (item: FoodItem) => void
  onRemove: (index: number) => void; onBack: () => void
}

const ACTIVITY = { sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55, very_active: 1.725 }
const GOAL_DELTA = { lose_weight: -400, gain_muscle: 300, maintain: 0, improve_endurance: 100, flexibility: 0 }

function calcTDEE(profile: any) {
  const dob = new Date(profile.dateOfBirth)
  const age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  const bmr = profile.gender === 'female'
    ? 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age - 161
    : 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age + 5
  const activity = ACTIVITY[profile.activityLevel as keyof typeof ACTIVITY] ?? 1.375
  const delta = GOAL_DELTA[profile.goal as keyof typeof GOAL_DELTA] ?? 0
  const tdee = Math.round(bmr * activity + delta)
  const protein = Math.round(profile.weightKg * 2)
  const fat = Math.round((tdee * 0.25) / 9)
  const carbs = Math.round((tdee - protein * 4 - fat * 9) / 4)
  return { tdee, protein, fat, carbs }
}

function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: C.card2, borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: C.gray, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function DishModal({ dish, onClose, onEat }: { dish: FoodItem; onClose: () => void; onEat: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{
        background: C.card, borderRadius: '24px 24px 0 0',
        width: '100%', maxWidth: 480, margin: '0 auto',
        maxHeight: '88vh', overflowY: 'auto', padding: '0 0 32px',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ position: 'sticky', top: 0, background: C.card, padding: '16px 20px 12px', zIndex: 1 }}>
          <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 16px' }} />
          <div style={{ fontSize: 20, fontWeight: 800, color: C.white }}>{dish.name}</div>
          <div style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>{dish.description}</div>
        </div>

        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
            <MacroPill label="ккал" value={String(dish.calories)} color={C.orange} />
            <MacroPill label="белки" value={`${dish.protein}г`} color="#FF6B6B" />
            <MacroPill label="жиры" value={`${dish.fat}г`} color="#FFA94D" />
            <MacroPill label="углев." value={`${dish.carbs}г`} color={C.green} />
          </div>

          {dish.ingredients && dish.ingredients.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShoppingCart size={14} color={C.gray} /> Ингредиенты
              </div>
              <div style={{ background: C.card2, borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                {dish.ingredients.map((ing, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < dish.ingredients!.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: C.orange, flexShrink: 0 }} />
                    <div style={{ fontSize: 14, color: C.white }}>{ing}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dish.recipe && dish.recipe.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChefHat size={14} color={C.gray} /> Приготовление
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dish.recipe.map((step, i) => {
                  const colonIdx = step.indexOf(':')
                  const hasTitle = colonIdx > 0 && colonIdx < 35
                  const title = hasTitle ? step.slice(0, colonIdx) : null
                  const body = hasTitle ? step.slice(colonIdx + 1).trim() : step
                  return (
                    <div key={i} style={{ display: 'flex', gap: 14, background: C.card2, borderRadius: 16, padding: '14px 16px', border: `1px solid ${C.border}` }}>
                      <div style={{ width: 28, height: 28, borderRadius: 14, background: C.orange, color: '#fff', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                      <div>
                        {title && <div style={{ fontSize: 13, fontWeight: 700, color: C.orange, marginBottom: 4 }}>{title}</div>}
                        <div style={{ fontSize: 14, color: C.white, lineHeight: 1.6 }}>{body}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <button onClick={() => { onEat(); onClose() }} style={{
            width: '100%', padding: '16px', background: C.orange,
            color: '#fff', borderRadius: 16, fontSize: 16, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Check size={18} /> Съел это блюдо
          </button>
        </div>
      </div>
    </div>
  )
}

function CustomDishModal({ onClose, onAdd }: { onClose: () => void; onAdd: (item: FoodItem) => void }) {
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [carbs, setCarbs] = useState('')
  const [err, setErr] = useState('')

  function submit() {
    if (!name.trim()) { setErr('Введите название'); return }
    if (!calories || +calories < 0) { setErr('Введите калории'); return }
    onAdd({
      name: name.trim(),
      description: 'Добавлено вручную',
      calories: +calories || 0,
      protein: +protein || 0,
      fat: +fat || 0,
      carbs: +carbs || 0,
    })
    onClose()
  }

  const numStyle: React.CSSProperties = {
    flex: 1, background: C.card2, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '12px 14px', fontSize: 20, fontWeight: 800,
    color: C.white, textAlign: 'center' as const, width: '100%',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, margin: '0 auto', padding: '20px 20px 36px', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.white }}>Своё блюдо</div>
          <button onClick={onClose} style={{ color: C.gray, display: 'flex', alignItems: 'center' }}><X size={22} /></button>
        </div>

        {/* Название */}
        <input
          placeholder="Название блюда"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ width: '100%', background: C.card2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', fontSize: 16, color: C.white, marginBottom: 16 }}
        />

        {/* КБЖУ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Калории', unit: 'ккал', val: calories, set: setCalories, color: C.orange },
            { label: 'Белки', unit: 'г', val: protein, set: setProtein, color: '#FF6B6B' },
            { label: 'Жиры', unit: 'г', val: fat, set: setFat, color: '#FFA94D' },
            { label: 'Углеводы', unit: 'г', val: carbs, set: setCarbs, color: C.green },
          ].map(f => (
            <div key={f.label} style={{ background: C.card2, borderRadius: 16, padding: '12px 14px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, color: C.gray, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{f.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <input
                  type="number" placeholder="0" value={f.val}
                  onChange={e => f.set(e.target.value)}
                  style={{ ...numStyle, color: f.color, padding: 0, border: 'none', background: 'none', borderRadius: 0 }}
                />
                <span style={{ fontSize: 12, color: C.gray }}>{f.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {err && <div style={{ color: C.red, fontSize: 13, marginBottom: 10, textAlign: 'center' }}>{err}</div>}

        <button onClick={submit} style={{ width: '100%', padding: '16px', background: C.orange, color: '#fff', borderRadius: 16, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Check size={18} /> Добавить в рацион
        </button>
      </div>
    </div>
  )
}

export default function Food({ user, eaten, onEat, onRemove, onBack }: Props) {
  const [want, setWant] = useState('')
  const [suggestions, setSuggestions] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedDish, setSelectedDish] = useState<FoodItem | null>(null)
  const [showCustom, setShowCustom] = useState(false)

  const macros = user.profile ? calcTDEE(user.profile) : null
  const consumed = eaten.reduce((acc, f) => ({ cal: acc.cal + f.calories, p: acc.p + f.protein, f: acc.f + f.fat, c: acc.c + f.carbs }), { cal: 0, p: 0, f: 0, c: 0 })
  const remaining = macros ? { cal: Math.max(0, macros.tdee - consumed.cal), p: Math.max(0, macros.protein - consumed.p), f: Math.max(0, macros.fat - consumed.f), c: Math.max(0, macros.carbs - consumed.c) } : null
  const progressPct = macros ? Math.min(100, (consumed.cal / macros.tdee) * 100) : 0

  async function generate() {
    if (!macros || !want.trim()) return
    setError(''); setLoading(true)
    try {
      const res = await api.ai.foodSuggestions({ want, eatenItems: eaten.map(e => e.name), remainingCalories: remaining!.cal, remainingProtein: remaining!.p, remainingFat: remaining!.f, remainingCarbs: remaining!.c })
      setSuggestions(res.suggestions ?? [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 40 }}>
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: C.card2, color: C.white, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.white, flex: 1 }}>Питание</div>
        <button onClick={() => setShowCustom(true)} style={{ width: 36, height: 36, borderRadius: 10, background: C.orange, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={20} />
        </button>
      </div>

      <div style={{ padding: '0 16px' }}>
        {macros && (
          <div style={{ background: C.card, borderRadius: 24, padding: 20, marginBottom: 16, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: 1 }}>Съедено</div>
                <div style={{ fontSize: 34, fontWeight: 900, color: progressPct >= 100 ? C.red : C.orange, lineHeight: 1, marginTop: 4 }}>
                  {consumed.cal}<span style={{ fontSize: 14, fontWeight: 400, color: C.gray }}> / {macros.tdee} ккал</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: C.gray }}>Осталось</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.white, marginTop: 2 }}>{remaining?.cal ?? 0} ккал</div>
              </div>
            </div>
            <div style={{ height: 6, background: C.card2, borderRadius: 3, marginBottom: 14 }}>
              <div style={{ height: 6, borderRadius: 3, width: `${progressPct}%`, transition: 'width 0.4s', background: progressPct >= 100 ? C.red : `linear-gradient(90deg, ${C.orange}, #FF9F1C)` }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[{ l: 'Белки', d: consumed.p, t: macros.protein, c: '#FF6B6B' }, { l: 'Жиры', d: consumed.f, t: macros.fat, c: '#FFA94D' }, { l: 'Углеводы', d: consumed.c, t: macros.carbs, c: C.green }].map(m => (
                <div key={m.l} style={{ background: C.card2, borderRadius: 12, padding: '10px' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: m.c }}>{m.d}г</div>
                  <div style={{ fontSize: 10, color: C.gray, marginTop: 2 }}>{m.l} / {m.t}г</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {eaten.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>Сегодня съел</div>
            {eaten.map((item, i) => (
              <div key={i} style={{ background: C.card, borderRadius: 14, padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{item.calories} ккал · Б{item.protein} Ж{item.fat} У{item.carbs}</div>
                </div>
                <button onClick={() => onRemove(i)} style={{ color: C.gray2, padding: '0 4px', display: 'flex', alignItems: 'center' }}>
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: C.card, borderRadius: 20, padding: 16, marginBottom: 16, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 10 }}>Что хочешь?</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input value={want} onChange={e => setWant(e.target.value)} onKeyDown={e => e.key === 'Enter' && generate()}
              placeholder="говядина, гречка, яйца..."
              style={{ flex: 1, background: C.card2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: C.white }} />
            <button onClick={generate} disabled={loading || !want.trim()} style={{
              padding: '12px 16px', background: want.trim() ? C.orange : C.card2,
              borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {loading ? '...' : <Sparkles size={18} />}
            </button>
          </div>
          {error && <div style={{ color: C.red, fontSize: 13, marginTop: 8 }}>{error}</div>}
          {suggestions.length > 0 && (
            <button onClick={generate} disabled={loading} style={{ marginTop: 10, width: '100%', padding: '10px', background: C.card2, borderRadius: 10, fontSize: 13, color: C.gray, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <RefreshCw size={14} /> Другие варианты
            </button>
          )}
        </div>

        {suggestions.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>Варианты</div>
            {suggestions.map((s, i) => (
              <div key={i} onClick={() => setSelectedDish(s)} style={{ background: C.card, borderRadius: 18, padding: 16, marginBottom: 10, cursor: 'pointer', border: `1px solid ${C.border}`, transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.white, flex: 1 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: C.orange, marginLeft: 12, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 2 }}>
                    Рецепт <ChevronRight size={16} />
                  </div>
                </div>
                <div style={{ fontSize: 13, color: C.gray, marginBottom: 10, lineHeight: 1.4 }}>{s.description}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                  <span style={{ color: C.orange, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Flame size={13} /> {s.calories}</span>
                  <span style={{ color: '#FF6B6B' }}>Б {s.protein}г</span>
                  <span style={{ color: '#FFA94D' }}>Ж {s.fat}г</span>
                  <span style={{ color: C.green }}>У {s.carbs}г</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDish && (
        <DishModal dish={selectedDish} onClose={() => setSelectedDish(null)}
          onEat={() => { onEat(selectedDish); setSuggestions(prev => prev.filter(s => s.name !== selectedDish.name)) }} />
      )}
      {showCustom && (
        <CustomDishModal onClose={() => setShowCustom(false)} onAdd={item => { onEat(item); setShowCustom(false) }} />
      )}
    </div>
  )
}
