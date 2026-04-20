import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'

interface JwtPayload {
  sub: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user: { id: string }
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing authorization header' })
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    request.user = { id: payload.sub }
  } catch {
    return reply.code(401).send({ error: 'Invalid or expired token' })
  }
}
