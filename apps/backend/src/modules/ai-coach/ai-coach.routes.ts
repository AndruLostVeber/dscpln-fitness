import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../lib/auth.middleware'
import { AiCoachService } from './ai-coach.service'
import { ChatSchema, WorkoutPlanSchema, FoodSuggestionsSchema, WorkoutSuggestionsSchema } from './ai-coach.schemas'

export async function aiCoachRoutes(app: FastifyInstance) {
  app.post('/chat', { preHandler: [requireAuth] }, async (request, reply) => {
    const { message } = ChatSchema.parse(request.body)
    const response = await AiCoachService.chat((request as any).user.id, message)
    return reply.code(200).send({ response })
  })

  app.post('/workout-plan', { preHandler: [requireAuth] }, async (request, reply) => {
    const { notes } = WorkoutPlanSchema.parse(request.body)
    const plan = await AiCoachService.generateWorkoutPlan((request as any).user.id, notes)
    return reply.code(200).send(plan)
  })

  app.get('/history', { preHandler: [requireAuth] }, async (request, reply) => {
    const history = await AiCoachService.getChatHistory((request as any).user.id)
    return reply.code(200).send(history)
  })

  app.get('/motivation', { preHandler: [requireAuth] }, async (request, reply) => {
    const message = await AiCoachService.getMotivation((request as any).user.id)
    return reply.code(200).send({ message })
  })

  app.post('/food-suggestions', { preHandler: [requireAuth] }, async (request, reply) => {
    const input = FoodSuggestionsSchema.parse(request.body)
    const result = await AiCoachService.getFoodSuggestions((request as any).user.id, input)
    return reply.code(200).send(result)
  })

  app.post('/workout-suggestions', { preHandler: [requireAuth] }, async (request, reply) => {
    const { focus } = WorkoutSuggestionsSchema.parse(request.body)
    const result = await AiCoachService.getWorkoutSuggestions((request as any).user.id, focus)
    return reply.code(200).send(result)
  })
}
