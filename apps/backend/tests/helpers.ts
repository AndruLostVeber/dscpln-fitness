import Fastify from 'fastify'
import { ZodError } from 'zod'
import { authRoutes } from '../src/modules/auth/auth.routes'
import { aiCoachRoutes } from '../src/modules/ai-coach/ai-coach.routes'
import { workoutsRoutes } from '../src/modules/workouts/workouts.routes'
import { connectRedis } from '../src/plugins/redis'

export async function buildApp() {
  const app = Fastify({ logger: false })

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: error.errors })
    }
    const statusCode = (error as any).statusCode ?? error.statusCode ?? 500
    return reply.code(statusCode).send({ error: error.message })
  })

  app.register(authRoutes, { prefix: '/auth' })
  app.register(aiCoachRoutes, { prefix: '/ai' })
  app.register(workoutsRoutes, { prefix: '/workouts' })

  await connectRedis()
  await app.ready()
  return app
}

export const testUser = {
  email: `test_${Date.now()}@example.com`,
  password: 'password123',
  name: 'Test User',
  dateOfBirth: '1995-06-15',
  gender: 'male',
  heightCm: 180,
  weightKg: 80,
  goal: 'gain_muscle',
  fitnessLevel: 'intermediate',
  motivationStyle: 'medium',
  activityLevel: 'moderately_active',
  workoutsPerWeek: 4,
  injuries: [],
  dietPreference: 'omnivore',
}
