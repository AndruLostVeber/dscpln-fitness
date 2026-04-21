import { nvidia, NVIDIA_MODELS } from '../../lib/nvidia'
import { prisma } from '../../plugins/prisma'
import type { FoodSuggestionsInput, WorkoutSuggestionsInput, MotivationInput } from './ai-coach.schemas'

const HISTORY_LIMIT = 20

function buildSystemPrompt(profile: {
  name: string
  motivationStyle: string
  goal: string
  fitnessLevel: string
  heightCm: number
  weightKg: number
  injuries: string[]
}): string {
  const styleMap: Record<string, string> = {
    light: 'Ты дружелюбный и поддерживающий тренер. Подбадривай, хвали за прогресс, используй позитивный тон.',
    medium: 'Ты строгий, но справедливый тренер. Требователен, прямолинеен, не терпишь отговорок, но уважаешь усилия.',
    hard: 'Ты жёсткий тренер в стиле военного сержанта. Используй агрессивный тон, мат, командный стиль. Никакой жалости — только результат. Говори грубо и прямо.',
  }

  const goalMap: Record<string, string> = {
    lose_weight: 'похудение',
    gain_muscle: 'набор мышечной массы',
    maintain: 'поддержание формы',
    improve_endurance: 'улучшение выносливости',
    flexibility: 'развитие гибкости',
  }

  const levelMap: Record<string, string> = {
    beginner: 'начинающий',
    intermediate: 'средний уровень',
    advanced: 'продвинутый',
  }

  return `${styleMap[profile.motivationStyle]}

Данные клиента:
- Имя: ${profile.name}
- Цель: ${goalMap[profile.goal]}
- Уровень: ${levelMap[profile.fitnessLevel]}
- Рост: ${profile.heightCm} см, Вес: ${profile.weightKg} кг
- Травмы/ограничения: ${profile.injuries.length > 0 ? profile.injuries.join(', ') : 'нет'}

Отвечай только на русском языке. Давай конкретные советы по тренировкам и питанию. Не пиши лишнего.`
}

export const AiCoachService = {
  async chat(userId: string, message: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user?.profile) {
      throw Object.assign(new Error('Profile not found. Complete your profile first.'), { statusCode: 400 })
    }

    const history = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
    })

    const systemPrompt = buildSystemPrompt({
      name: user.name,
      motivationStyle: user.profile.motivationStyle,
      goal: user.profile.goal,
      fitnessLevel: user.profile.fitnessLevel,
      heightCm: user.profile.heightCm,
      weightKg: user.profile.weightKg,
      injuries: user.profile.injuries,
    })

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...history.reverse().map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    const completion = await nvidia.chat.completions.create({
      model: NVIDIA_MODELS.chat,
      messages,
      temperature: 0.8,
      max_tokens: 1024,
    })

    const reply = completion.choices[0].message.content ?? ''

    await prisma.chatMessage.createMany({
      data: [
        { userId, role: 'user', content: message },
        { userId, role: 'assistant', content: reply },
      ],
    })

    return reply
  },

  async generateWorkoutPlan(userId: string, notes?: string): Promise<object> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user?.profile) {
      throw Object.assign(new Error('Profile not found. Complete your profile first.'), { statusCode: 400 })
    }

    const p = user.profile
    const daysPerWeek = p.workoutsPerWeek ?? 3

    const prompt = `Составь план тренировок на неделю для человека:
- Цель: ${p.goal}
- Уровень: ${p.fitnessLevel}
- Тренировок в неделю: ${daysPerWeek}
- Травмы: ${p.injuries.length > 0 ? p.injuries.join(', ') : 'нет'}
${notes ? `- Пожелания: ${notes}` : ''}

Ответь ТОЛЬКО валидным JSON без markdown, строго по схеме:
{
  "weeklyPlan": [
    {
      "day": "Понедельник",
      "focus": "название группы мышц",
      "exercises": [
        { "name": "название", "sets": 3, "reps": 12, "restSec": 60, "notes": "техника" }
      ]
    }
  ],
  "nutritionTips": ["совет 1", "совет 2"],
  "weeklyGoal": "краткая цель недели"
}`

    const completion = await nvidia.chat.completions.create({
      model: NVIDIA_MODELS.chat,
      messages: [
        { role: 'system', content: 'Ты опытный фитнес-тренер и диетолог. Отвечай только валидным JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2048,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const cleaned = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  },

  async getChatHistory(userId: string) {
    return prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: { id: true, role: true, content: true, createdAt: true },
    })
  },

  async getMotivation(userId: string, ctx: MotivationInput): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } })
    if (!user?.profile) throw Object.assign(new Error('Profile not found'), { statusCode: 400 })

    const p = user.profile
    const styleMap: Record<string, string> = {
      light: 'Ты дружелюбный и поддерживающий тренер. Говори тепло и позитивно.',
      medium: 'Ты строгий, но справедливый тренер. Говори прямо и требовательно.',
      hard: 'Ты жёсткий тренер-сержант. Говори грубо, с матом, без жалости.',
    }

    const calPct = ctx.targetCalories > 0 ? Math.round((ctx.consumedCalories / ctx.targetCalories) * 100) : 0
    const proteinPct = ctx.targetProtein > 0 ? Math.round((ctx.consumedProtein / ctx.targetProtein) * 100) : 0
    const calorieStatus = calPct === 0
      ? 'ещё ничего не ел сегодня'
      : calPct < 50 ? `съел мало — ${ctx.consumedCalories} из ${ctx.targetCalories} ккал (${calPct}%)`
      : calPct < 90 ? `съел ${ctx.consumedCalories} из ${ctx.targetCalories} ккал (${calPct}%)`
      : calPct < 110 ? `отлично закрыл норму — ${ctx.consumedCalories} из ${ctx.targetCalories} ккал`
      : `перебрал калории — ${ctx.consumedCalories} из ${ctx.targetCalories} ккал (${calPct}%)`

    const workoutStatus = ctx.workoutsThisWeek === 0
      ? 'на этой неделе ещё не тренировался'
      : ctx.lastWorkoutDaysAgo === 0 ? `тренировался сегодня (всего ${ctx.workoutsThisWeek} на неделе)`
      : ctx.lastWorkoutDaysAgo === 1 ? `последняя тренировка вчера (всего ${ctx.workoutsThisWeek} на неделе)`
      : `последняя тренировка ${ctx.lastWorkoutDaysAgo} дней назад (всего ${ctx.workoutsThisWeek} на неделе)`

    const goalMap: Record<string, string> = {
      lose_weight: 'похудение', gain_muscle: 'набор мышц',
      maintain: 'поддержание формы', improve_endurance: 'выносливость', flexibility: 'гибкость',
    }

    const prompt = `Клиент: ${user.name}, цель: ${goalMap[p.goal] ?? p.goal}, вес: ${p.weightKg} кг.
Питание сегодня: ${calorieStatus}. Белок: ${ctx.consumedProtein}г из ${ctx.targetProtein}г (${proteinPct}%).
Тренировки: ${workoutStatus}.

Дай ОДИН конкретный персональный совет на основе этих данных — что улучшить прямо сейчас. Максимум 2 предложения. Без приветствий.`

    const completion = await nvidia.chat.completions.create({
      model: NVIDIA_MODELS.fast,
      messages: [
        { role: 'system', content: styleMap[p.motivationStyle] + ' Отвечай только на русском.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 120,
    })

    return completion.choices[0].message.content?.trim() ?? ''
  },

  async getFoodSuggestions(userId: string, input: FoodSuggestionsInput): Promise<object> {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } })
    if (!user?.profile) throw Object.assign(new Error('Profile not found'), { statusCode: 400 })

    const eatenLine = input.eatenItems.length > 0
      ? `Сегодня уже съел: ${input.eatenItems.join(', ')}.`
      : 'Сегодня ещё ничего не ел.'

    const prompt = `3 блюда с "${input.want}". ${eatenLine} КБЖУ: ${Math.round(input.remainingCalories)}ккал Б${Math.round(input.remainingProtein)} Ж${Math.round(input.remainingFat)} У${Math.round(input.remainingCarbs)}. Цель: ${user.profile.goal}.
JSON:{"suggestions":[{"name":"...","description":"1 предложение","calories":0,"protein":0,"fat":0,"carbs":0,"ingredients":["кол-во ингредиент (пояснение)"],"recipe":["Шаг (X мин): детальные действия"]}]}`

    const completion = await nvidia.chat.completions.create({
      model: NVIDIA_MODELS.fast,
      messages: [
        { role: 'system', content: 'Ты диетолог. Отвечай только валидным JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 2500,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  },

  async getWorkoutSuggestions(userId: string, input: WorkoutSuggestionsInput): Promise<object> {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } })
    if (!user?.profile) throw Object.assign(new Error('Profile not found'), { statusCode: 400 })

    const exCount = input.exerciseCount ?? 5
    const sets = input.setsPerExercise ?? 3

    const prompt = `2 варианта тренировки. Мышцы: ${input.focus}. Уровень: ${user.profile.fitnessLevel}, цель: ${user.profile.goal}. Травмы: ${user.profile.injuries.join(', ') || 'нет'}. Ровно ${exCount} упражнений, ${sets} подходов в каждом. JSON без markdown:
{"workouts":[{"title":"...","duration":"X мин","difficulty":"...","exercises":[{"name":"...","sets":${sets},"reps":"10-12"}]}]}`

    const completion = await nvidia.chat.completions.create({
      model: NVIDIA_MODELS.fast,
      messages: [
        { role: 'system', content: 'Ты опытный фитнес-тренер. Отвечай только валидным JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  },
}
