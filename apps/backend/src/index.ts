import Fastify from 'fastify'
import { ZodError } from 'zod'
import { authRoutes } from './modules/auth/auth.routes'
import { aiCoachRoutes } from './modules/ai-coach/ai-coach.routes'
import { workoutsRoutes } from './modules/workouts/workouts.routes'
import { connectRedis } from './plugins/redis'

const app = Fastify({ logger: true })

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    return reply.code(400).send({ error: error.errors })
  }
  const statusCode = (error as any).statusCode ?? error.statusCode ?? 500
  app.log.error(error)
  return reply.code(statusCode).send({ error: error.message })
})

app.register(authRoutes, { prefix: '/auth' })
app.register(aiCoachRoutes, { prefix: '/ai' })
app.register(workoutsRoutes, { prefix: '/workouts' })

async function start() {
  await connectRedis()
  await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' })
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})

export { app }
