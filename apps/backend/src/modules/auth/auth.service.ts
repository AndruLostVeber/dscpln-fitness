import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '../../plugins/prisma'
import { redis } from '../../plugins/redis'
import type { RegisterInput, LoginInput, UpdateProfileInput } from './auth.schemas'

const BCRYPT_ROUNDS = 12
const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_DAYS = 30

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
)

function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_TTL })
}

async function createSession(userId: string): Promise<string> {
  const refreshToken = randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS)
  await prisma.session.create({ data: { userId, refreshToken, expiresAt } })
  return refreshToken
}

function userPublicFields() {
  return {
    id: true,
    email: true,
    name: true,
    createdAt: true,
    profile: true,
  } as const
}

export const AuthService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } })
    if (existing) throw Object.assign(new Error('Email already in use'), { statusCode: 409 })

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)

    const user = await prisma.$transaction(async tx => {
      return tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.name,
          profile: {
            create: {
              dateOfBirth: input.dateOfBirth,
              gender: input.gender,
              heightCm: input.heightCm,
              weightKg: input.weightKg,
              goal: input.goal,
              fitnessLevel: input.fitnessLevel,
              motivationStyle: input.motivationStyle,
              activityLevel: input.activityLevel ?? null,
              workoutsPerWeek: input.workoutsPerWeek ?? null,
              injuries: input.injuries ?? [],
              dietPreference: input.dietPreference ?? null,
            },
          },
        },
        select: userPublicFields(),
      })
    })

    const accessToken = signAccessToken(user.id)
    const refreshToken = await createSession(user.id)
    return { accessToken, refreshToken, user }
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { ...userPublicFields(), passwordHash: true },
    })

    if (!user || !user.passwordHash) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 })
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash)
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 })

    const { passwordHash: _, ...safeUser } = user
    const accessToken = signAccessToken(user.id)
    const refreshToken = await createSession(user.id)
    return { accessToken, refreshToken, user: safeUser }
  },

  async googleAuth(googleIdToken: string) {
    const ticket = await googleClient.verifyIdToken({
      idToken: googleIdToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload?.sub || !payload.email) {
      throw Object.assign(new Error('Invalid Google token'), { statusCode: 400 })
    }

    let isNewUser = false
    let user = await prisma.user.findUnique({
      where: { googleId: payload.sub },
      select: userPublicFields(),
    })

    if (!user) {
      isNewUser = true
      user = await prisma.user.create({
        data: {
          email: payload.email,
          googleId: payload.sub,
          name: payload.name ?? payload.email.split('@')[0],
        },
        select: userPublicFields(),
      })
    }

    const accessToken = signAccessToken(user.id)
    const refreshToken = await createSession(user.id)
    return { accessToken, refreshToken, user, isNewUser }
  },

  async refresh(refreshToken: string) {
    const blacklisted = await redis.get(`blacklist:${refreshToken}`)
    if (blacklisted) throw Object.assign(new Error('Token revoked'), { statusCode: 401 })

    const session = await prisma.session.findUnique({ where: { refreshToken } })
    if (!session || session.expiresAt < new Date()) {
      throw Object.assign(new Error('Session expired or not found'), { statusCode: 401 })
    }

    return { accessToken: signAccessToken(session.userId) }
  },

  async logout(refreshToken: string) {
    const session = await prisma.session.findUnique({ where: { refreshToken } })
    if (!session) return

    const ttlSeconds = Math.max(0, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000))
    if (ttlSeconds > 0) {
      await redis.setEx(`blacklist:${refreshToken}`, ttlSeconds, '1')
    }

    await prisma.session.delete({ where: { refreshToken } })
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 })

    return prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        dateOfBirth: input.dateOfBirth ?? new Date(),
        gender: input.gender ?? 'other',
        heightCm: input.heightCm ?? 170,
        weightKg: input.weightKg ?? 70,
        goal: input.goal ?? 'maintain',
        fitnessLevel: input.fitnessLevel ?? 'beginner',
        motivationStyle: input.motivationStyle ?? 'medium',
        activityLevel: input.activityLevel,
        workoutsPerWeek: input.workoutsPerWeek,
        injuries: input.injuries ?? [],
        dietPreference: input.dietPreference,
      },
      update: { ...input },
    })
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userPublicFields(),
    })
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 })
    return user
  },
}
