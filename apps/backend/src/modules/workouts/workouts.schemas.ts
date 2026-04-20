import { z } from 'zod'

export const ExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  sets: z.number().int().min(1).max(100),
  reps: z.number().int().min(1).max(1000).optional(),
  weightKg: z.number().min(0).max(1000).optional(),
  durationSec: z.number().int().min(1).optional(),
  notes: z.string().max(300).optional(),
})

export const LogWorkoutSchema = z.object({
  title: z.string().min(1).max(100),
  exercises: z.array(ExerciseSchema).min(1).max(50),
  durationMin: z.number().int().min(1).max(600),
  notes: z.string().max(500).optional(),
})

export type LogWorkoutInput = z.infer<typeof LogWorkoutSchema>
