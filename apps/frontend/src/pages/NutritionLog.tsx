import { ChevronLeft, X, Flame, UtensilsCrossed } from 'lucide-react'

const C = { bg: '#0D0D0F', card: '#16161A', card2: '#1E1E26', border: '#2A2A35', orange: '#FF6B35', white: '#FFFFFF', gray: '#8E8EA0', green: '#4ADE80', red: '#FF4757' }

interface FoodItem { name: string; calories: number; protein: number; fat: number; carbs: number }
interface Props { user: any; eaten: FoodItem[]; onRemove: (index: number) => void; onBack: () => void }

const ACTIVITY = { sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55, very_active: 1.725 }
const GOAL_DELTA = { lose_weight: -400, gain_muscle: 300, maintain: 0, improve_endurance: 100, flexibility: 0 }

function calcTDEE(profile: any) {
  const dob = new Date(profile.dateOfBirth)
  const age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  const bmr = profile.gender === 'female' ? 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age - 161 : 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age + 5
  const activity = ACTIVITY[profile.activityLevel as keyof typeof ACTIVITY] ?? 1.375
  const delta = GOAL_DELTA[profile.goal as keyof typeof GOAL_DELTA] ?? 0
  const tdee = Math.round(bmr * activity + delta)
  const protein = Math.round(profile.weightKg * 2)
  const fat = Math.round((tdee * 0.25) / 9)
  const carbs = Math.round((tdee - protein * 4 - fat * 9) / 4)
  return { tdee, protein, fat, carbs }
}

export default function NutritionLog({ user, eaten, onRemove, onBack }: Props) {
  const macros = user.profile ? calcTDEE(user.profile) : null
  const consumed = eaten.reduce((acc, f) => ({ cal: acc.cal + f.calories, p: acc.p + f.protein, f: acc.f + f.fat, c: acc.c + f.carbs }), { cal: 0, p: 0, f: 0, c: 0 })
  const progressPct = macros ? Math.min(100, (consumed.cal / macros.tdee) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 40 }}>
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: C.card2, color: C.white, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.white }}>Рацион сегодня</div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {macros && (
          <div style={{ background: C.card, borderRadius: 24, padding: 20, marginBottom: 20, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: 1 }}>Съедено</div>
                <div style={{ fontSize: 38, fontWeight: 900, color: progressPct >= 100 ? C.red : C.orange, lineHeight: 1, marginTop: 4 }}>
                  {consumed.cal}<span style={{ fontSize: 14, fontWeight: 400, color: C.gray }}> ккал</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: C.gray }}>Цель</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.white }}>{macros.tdee}</div>
              </div>
            </div>
            <div style={{ height: 8, background: C.card2, borderRadius: 4, marginBottom: 16 }}>
              <div style={{ height: 8, borderRadius: 4, width: `${progressPct}%`, transition: 'width 0.4s', background: progressPct >= 100 ? C.red : progressPct >= 80 ? '#FFA94D' : C.orange }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[{ l: 'Белки', d: consumed.p, t: macros.protein, c: '#FF6B6B' }, { l: 'Жиры', d: consumed.f, t: macros.fat, c: '#FFA94D' }, { l: 'Углеводы', d: consumed.c, t: macros.carbs, c: C.green }].map(m => {
                const pct = Math.min(100, Math.round((m.d / m.t) * 100))
                return (
                  <div key={m.l} style={{ background: C.card2, borderRadius: 14, padding: '12px' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: m.c }}>{m.d}г</div>
                    <div style={{ fontSize: 10, color: C.gray, marginBottom: 8 }}>{m.l} / {m.t}г</div>
                    <div style={{ height: 4, background: '#2A2A35', borderRadius: 2 }}>
                      <div style={{ height: 4, background: m.c, borderRadius: 2, width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {eaten.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.gray }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <UtensilsCrossed size={56} color={C.gray} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.white, marginBottom: 8 }}>Ничего не съедено</div>
            <div style={{ fontSize: 14 }}>Перейди в раздел Еда и добавь блюда</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, color: C.gray, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>Съедено — {eaten.length} блюд</div>
            {eaten.map((item, i) => (
              <div key={i} style={{ background: C.card, borderRadius: 16, padding: '14px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${C.border}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.white, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                    <span style={{ color: C.orange, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Flame size={13} /> {item.calories}</span>
                    <span style={{ color: '#FF6B6B' }}>Б {item.protein}г</span>
                    <span style={{ color: '#FFA94D' }}>Ж {item.fat}г</span>
                    <span style={{ color: C.green }}>У {item.carbs}г</span>
                  </div>
                </div>
                <button onClick={() => onRemove(i)} style={{ color: C.gray, padding: '0 6px', display: 'flex', alignItems: 'center' }}>
                  <X size={18} />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
