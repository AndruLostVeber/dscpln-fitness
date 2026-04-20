import { nvidia, NVIDIA_MODELS } from '../../lib/nvidia'
import { prisma } from '../../plugins/prisma'
import type { FoodSuggestionsInput, WorkoutSuggestionsInput } from './ai-coach.schemas'

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

  async getMotivation(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } })
    if (!user?.profile) throw Object.assign(new Error('Profile not found'), { statusCode: 400 })

    const styleMap: Record<string, string> = {
      light: 'Ты дружелюбный тренер. Скажи короткую мотивирующую фразу на сегодня.',
      medium: 'Ты строгий тренер. Скажи короткую требовательную фразу-напоминание на сегодня.',
      hard: 'Ты жёсткий тренер-сержант. Скажи короткую агрессивную фразу с матом, чтобы заставить тренироваться.',
    }

    const completion = await nvidia.chat.completions.create({
      model: NVIDIA_MODELS.chat,
      messages: [
        { role: 'system', content: styleMap[user.profile.motivationStyle] },
        { role: 'user', content: `Клиент: ${user.name}, цель: ${user.profile.goal}. Одна фраза, максимум 2 предложения.` },
      ],
      temperature: 0.9,
      max_tokens: 100,
    })

    return completion.choices[0].message.content ?? ''
  },

  async getFoodSuggestions(userId: string, input: FoodSuggestionsInput): Promise<object> {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } })
    if (!user?.profile) throw Object.assign(new Error('Profile not found'), { statusCode: 400 })

    const eatenLine = input.eatenItems.length > 0
      ? `Сегодня уже съел: ${input.eatenItems.join(', ')}.`
      : 'Сегодня ещё ничего не ел.'

    const prompt = `Ты диетолог. Составь 10 вариантов блюд для человека.

${eatenLine}
Желаемый ингредиент: "${input.want}" — ВСЕ блюда обязаны его содержать как основной ингредиент.

Остаток КБЖУ на сегодня:
- Калории: ${Math.round(input.remainingCalories)} ккал
- Белки: ${Math.round(input.remainingProtein)}г
- Жиры: ${Math.round(input.remainingFat)}г
- Углеводы: ${Math.round(input.remainingCarbs)}г

Каждое блюдо должно укладываться в этот остаток или незначительно его превышать (не более чем на 15%). Учитывай что человек цель: ${user.profile.goal}. Блюда должны быть разными по способу приготовления.

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "suggestions": [
    {
      "name": "Название блюда",
      "description": "Способ приготовления, 1 предложение",
      "calories": 400,
      "protein": 30,
      "fat": 10,
      "carbs": 45
    }
  ]
}`

    const completion = await nvidia.chat.completions.create({
      model: NVIDIA_MODELS.chat,
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

  async getWorkoutSuggestions(userId: string, focus: string): Promise<object> {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } })
    if (!user?.profile) throw Object.assign(new Error('Profile not found'), { statusCode: 400 })

    const prompt = `Составь 2 варианта тренировки на сегодня.
Фокус: ${focus}.
Уровень: ${user.profile.fitnessLevel}, цель: ${user.profile.goal}.
Травмы: ${user.profile.injuries.length > 0 ? user.profile.injuries.join(', ') : 'нет'}.

Ответь ТОЛЬКО валидным JSON без markdown:
{
  "workouts": [
    {
      "title": "Название варианта",
      "duration": "45 мин",
      "difficulty": "средняя",
      "exercises": [
        { "name": "Упражнение", "sets": 4, "reps": "10-12", "rest": "60 сек" }
      ]
    }
  ]
}`

    const completion = await nvidia.chat.completions.create({
      model: NVIDIA_MODELS.chat,
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
