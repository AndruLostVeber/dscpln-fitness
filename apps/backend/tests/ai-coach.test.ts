import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp, testUser } from './helpers'
import { prisma } from '../src/plugins/prisma'
import { redis } from '../src/plugins/redis'

let app: Awaited<ReturnType<typeof buildApp>>
let accessToken: string

beforeAll(async () => {
  app = await buildApp()
  const user = { ...testUser, email: `ai_${Date.now()}@example.com` }
  const res = await app.inject({ method: 'POST', url: '/auth/register', body: user })
  accessToken = res.json().accessToken
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: 'ai_' } } })
  await redis.quit()
  await app.close()
})

describe('POST /ai/chat', () => {
  it('returns AI response', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/ai/chat',
      headers: { authorization: `Bearer ${accessToken}` },
      body: { message: 'Привет! Что мне делать для набора мышечной массы?' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.response).toBeDefined()
    expect(typeof body.response).toBe('string')
    expect(body.response.length).toBeGreaterThan(10)
  }, 30000)

  it('returns 401 without token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/ai/chat',
      body: { message: 'Привет' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 400 on empty message', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/ai/chat',
      headers: { authorization: `Bearer ${accessToken}` },
      body: { message: '' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('GET /ai/history', () => {
  it('returns chat history array', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/ai/history',
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.json())).toBe(true)
    expect(res.json().length).toBeGreaterThan(0)
  })
})

describe('POST /ai/workout-plan', () => {
  it('returns structured workout plan', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/ai/workout-plan',
      headers: { authorization: `Bearer ${accessToken}` },
      body: { notes: 'Хочу акцент на ноги' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.weeklyPlan).toBeDefined()
    expect(Array.isArray(body.weeklyPlan)).toBe(true)
    expect(body.weeklyPlan.length).toBeGreaterThan(0)
    expect(body.nutritionTips).toBeDefined()
    expect(body.weeklyGoal).toBeDefined()
  }, 30000)
})
