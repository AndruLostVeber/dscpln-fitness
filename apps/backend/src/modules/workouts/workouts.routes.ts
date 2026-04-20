import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../lib/auth.middleware'
import { WorkoutsService } from './workouts.service'
import { LogWorkoutSchema } from './workouts.schemas'
import { z } from 'zod'

const CursorSchema = z.object({ cursor: z.string().uuid().optional() })

export async function workoutsRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const input = LogWorkoutSchema.parse(request.body)
    const session = await WorkoutsService.log((request as any).user.id, input)
    return reply.code(201).send(session)
  })

  app.get('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const { cursor } = CursorSchema.parse(request.query)
    const sessions = await WorkoutsService.getHistory((request as any).user.id, cursor)
    return reply.code(200).send(sessions)
  })

  app.get('/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const session = await WorkoutsService.getOne((request as any).user.id, id)
    return reply.code(200).send(session)
  })

  app.delete('/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await WorkoutsService.delete((request as any).user.id, id)
    return reply.code(204).send()
  })
}
