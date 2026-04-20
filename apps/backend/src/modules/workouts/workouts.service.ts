import { prisma } from '../../plugins/prisma'
import type { LogWorkoutInput } from './workouts.schemas'

export const WorkoutsService = {
  async log(userId: string, input: LogWorkoutInput) {
    return prisma.workoutSession.create({
      data: {
        userId,
        title: input.title,
        durationMin: input.durationMin,
        notes: input.notes,
        exercises: {
          create: input.exercises,
        },
      },
      include: { exercises: true },
    })
  },

  async getHistory(userId: string, cursor?: string) {
    return prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { exercises: true },
    })
  },

  async getOne(userId: string, sessionId: string) {
    const session = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
      include: { exercises: true },
    })
    if (!session) throw Object.assign(new Error('Workout not found'), { statusCode: 404 })
    if (session.userId !== userId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 })
    return session
  },

  async delete(userId: string, sessionId: string) {
    const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } })
    if (!session) throw Object.assign(new Error('Workout not found'), { statusCode: 404 })
    if (session.userId !== userId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 })
    await prisma.workoutSession.delete({ where: { id: sessionId } })
  },
}
