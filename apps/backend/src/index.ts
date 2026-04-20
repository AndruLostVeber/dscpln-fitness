import Fastify from 'fastify'
import { authRoutes } from './modules/auth/auth.routes'
import { connectRedis } from './plugins/redis'

const app = Fastify({ logger: true })

app.setErrorHandler((error, _request, reply) => {
  const statusCode = (error as any).statusCode ?? error.statusCode ?? 500
  app.log.error(error)
  return reply.code(statusCode).send({ error: error.message })
})

app.register(authRoutes, { prefix: '/auth' })

async function start() {
  await connectRedis()
  await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' })
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})
