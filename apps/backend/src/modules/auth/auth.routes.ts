import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../lib/auth.middleware'
import { AuthService } from './auth.service'
import {
  RegisterSchema,
  LoginSchema,
  GoogleAuthSchema,
  RefreshSchema,
  UpdateProfileSchema,
  TelegramAuthSchema,
} from './auth.schemas'

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const input = RegisterSchema.parse(request.body)
    const result = await AuthService.register(input)
    return reply.code(201).send(result)
  })

  app.post('/login', async (request, reply) => {
    const input = LoginSchema.parse(request.body)
    const result = await AuthService.login(input)
    return reply.code(200).send(result)
  })

  app.post('/telegram', async (request, reply) => {
    const { initData } = TelegramAuthSchema.parse(request.body)
    const result = await AuthService.telegramAuth(initData)
    return reply.code(200).send(result)
  })

  app.post('/google', async (request, reply) => {
    const { googleIdToken } = GoogleAuthSchema.parse(request.body)
    const result = await AuthService.googleAuth(googleIdToken)
    return reply.code(200).send(result)
  })

  app.post('/refresh', async (request, reply) => {
    const { refreshToken } = RefreshSchema.parse(request.body)
    const result = await AuthService.refresh(refreshToken)
    return reply.code(200).send(result)
  })

  app.post('/logout', { preHandler: [requireAuth] }, async (request, reply) => {
    const { refreshToken } = RefreshSchema.parse(request.body)
    await AuthService.logout(refreshToken)
    return reply.code(204).send()
  })

  app.put('/profile', { preHandler: [requireAuth] }, async (request, reply) => {
    const input = UpdateProfileSchema.parse(request.body)
    const profile = await AuthService.updateProfile((request as any).user.id, input)
    return reply.code(200).send(profile)
  })

  app.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const user = await AuthService.getMe((request as any).user.id)
    return reply.code(200).send(user)
  })
}
