import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp, testUser } from './helpers'
import { prisma } from '../src/plugins/prisma'
import { redis } from '../src/plugins/redis'

let app: Awaited<ReturnType<typeof buildApp>>
let accessToken: string
let refreshToken: string
const user = { ...testUser, email: `auth_${Date.now()}@example.com` }

beforeAll(async () => {
  app = await buildApp()
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: 'auth_' } } })
  await redis.quit()
  await app.close()
})

describe('POST /auth/register', () => {
  it('creates user and returns tokens', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/register', body: user })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.accessToken).toBeDefined()
    expect(body.refreshToken).toBeDefined()
    expect(body.user.email).toBe(user.email)
    expect(body.user.passwordHash).toBeUndefined()
    expect(body.user.profile.goal).toBe('gain_muscle')
    accessToken = body.accessToken
    refreshToken = body.refreshToken
  })

  it('returns 409 on duplicate email', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/register', body: user })
    expect(res.statusCode).toBe(409)
  })

  it('returns 400 on age < 14', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      body: { ...user, email: 'kid@example.com', dateOfBirth: '2020-01-01' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 on invalid email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      body: { ...user, email: 'not-an-email' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 on short password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      body: { ...user, email: 'x@example.com', password: '123' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /auth/login', () => {
  it('returns tokens on valid credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: { email: user.email, password: user.password },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.accessToken).toBeDefined()
    expect(body.refreshToken).toBeDefined()
  })

  it('returns 401 on wrong password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: { email: user.email, password: 'wrongpass' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 401 on unknown email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: { email: 'nobody@example.com', password: 'password123' },
    })
    expect(res.statusCode).toBe(401)
  })
})

describe('GET /auth/me', () => {
  it('returns user with profile', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.email).toBe(user.email)
    expect(body.profile).toBeDefined()
  })

  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/me' })
    expect(res.statusCode).toBe(401)
  })

  it('returns 401 with invalid token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: 'Bearer invalid.token.here' },
    })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /auth/refresh', () => {
  it('returns new accessToken', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: { email: user.email, password: user.password },
    })
    const { refreshToken: rt } = loginRes.json()

    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      body: { refreshToken: rt },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().accessToken).toBeDefined()
  })

  it('returns 400 on invalid uuid format', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      body: { refreshToken: 'not-a-uuid' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /auth/logout', () => {
  it('invalidates refresh token', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/auth/login',
      body: { email: user.email, password: user.password },
    })
    const { accessToken: at, refreshToken: rt } = loginRes.json()

    const logoutRes = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { authorization: `Bearer ${at}` },
      body: { refreshToken: rt },
    })
    expect(logoutRes.statusCode).toBe(204)

    const refreshRes = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      body: { refreshToken: rt },
    })
    expect(refreshRes.statusCode).toBe(401)
    expect(refreshRes.json().error).toBe('Token revoked')
  })
})

describe('PUT /auth/profile', () => {
  it('updates profile fields', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/auth/profile',
      headers: { authorization: `Bearer ${accessToken}` },
      body: { weightKg: 85, workoutsPerWeek: 5 },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().weightKg).toBe(85)
    expect(res.json().workoutsPerWeek).toBe(5)
  })

  it('returns 400 on empty body', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/auth/profile',
      headers: { authorization: `Bearer ${accessToken}` },
      body: {},
    })
    expect(res.statusCode).toBe(400)
  })
})
