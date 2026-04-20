import { z } from 'zod'

export const ChatSchema = z.object({
  message: z.string().min(1).max(2000),
})

export type ChatInput = z.infer<typeof ChatSchema>

export const WorkoutPlanSchema = z.object({
  notes: z.string().max(500).optional(),
})

export type WorkoutPlanInput = z.infer<typeof WorkoutPlanSchema>
