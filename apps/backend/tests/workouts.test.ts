import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp, testUser } from './helpers'
import { prisma } from '../src/plugins/prisma'
import { redis } from '../src/plugins/redis'

let app: Awaited<ReturnType<typeof buildApp>>
let accessToken: string
let workoutId: string

const workoutBody = {
  title: 'Грудь и трицепс',
  durationMin: 60,
  notes: 'Хорошая тренировка',
  exercises: [
    { name: 'Жим лёжа', sets: 4, reps: 8, weightKg: 80 },
    { name: 'Разводка', sets: 3, reps: 12, weightKg: 20 },
    { name: 'Отжимания на брусьях', sets: 3, reps: 15 },
  ],
}

beforeAll(async () => {
  app = await buildApp()
  const user = { ...testUser, email: `workout_${Date.now()}@example.com` }
  const res = await app.inject({ method: 'POST', url: '/auth/register', body: user })
  accessToken = res.json().accessToken
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: 'workout_' } } })
  await redis.quit()
  await app.close()
})

describe('POST /workouts', () => {
  it('logs a workout session', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/workouts',
      headers: { authorization: `Bearer ${accessToken}` },
      body: workoutBody,
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.title).toBe(workoutBody.title)
    expect(body.exercises).toHaveLength(3)
    workoutId = body.id
  })

  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'POST', url: '/workouts', body: workoutBody })
    expect(res.statusCode).toBe(401)
  })

  it('returns 400 with no exercises', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/workouts',
      headers: { authorization: `Bearer ${accessToken}` },
      body: { ...workoutBody, exercises: [] },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('GET /workouts', () => {
  it('returns workout history', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/workouts',
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.json())).toBe(true)
    expect(res.json().length).toBeGreaterThan(0)
  })

  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/workouts' })
    expect(res.statusCode).toBe(401)
  })
})

describe('GET /workouts/:id', () => {
  it('returns workout by id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/workouts/${workoutId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().id).toBe(workoutId)
    expect(res.json().exercises).toHaveLength(3)
  })

  it('returns 404 for non-existent workout', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/workouts/00000000-0000-0000-0000-000000000000',
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /workouts/:id', () => {
  it('deletes workout', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/workouts',
      headers: { authorization: `Bearer ${accessToken}` },
      body: { ...workoutBody, title: 'To delete' },
    })
    const id = createRes.json().id

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/workouts/${id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(deleteRes.statusCode).toBe(204)

    const getRes = await app.inject({
      method: 'GET',
      url: `/workouts/${id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(getRes.statusCode).toBe(404)
  })
})
