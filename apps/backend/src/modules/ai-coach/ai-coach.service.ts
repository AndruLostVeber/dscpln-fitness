import { nvidia, NVIDIA_MODELS } from '../../lib/nvidia'
import { prisma } from '../../plugins/prisma'

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
}
