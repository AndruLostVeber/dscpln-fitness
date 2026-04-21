import { z } from 'zod'

export const ChatSchema = z.object({
  message: z.string().min(1).max(2000),
})
export type ChatInput = z.infer<typeof ChatSchema>

export const WorkoutPlanSchema = z.object({
  notes: z.string().max(500).optional(),
})
export type WorkoutPlanInput = z.infer<typeof WorkoutPlanSchema>

export const FoodSuggestionsSchema = z.object({
  want: z.string().max(500),
  eatenItems: z.array(z.string()).max(50),
  remainingCalories: z.number(),
  remainingProtein: z.number(),
  remainingFat: z.number(),
  remainingCarbs: z.number(),
})
export type FoodSuggestionsInput = z.infer<typeof FoodSuggestionsSchema>

export const WorkoutSuggestionsSchema = z.object({
  focus: z.string().max(100),
  exerciseCount: z.number().int().min(2).max(12).optional(),
  setsPerExercise: z.number().int().min(1).max(6).optional(),
})
export type WorkoutSuggestionsInput = z.infer<typeof WorkoutSuggestionsSchema>

export const MotivationSchema = z.object({
  consumedCalories: z.number().min(0),
  targetCalories: z.number().min(0),
  consumedProtein: z.number().min(0),
  targetProtein: z.number().min(0),
  consumedFat: z.number().min(0),
  consumedCarbs: z.number().min(0),
  workoutsThisWeek: z.number().int().min(0),
  lastWorkoutDaysAgo: z.number().int().min(0).optional(),
})
export type MotivationInput = z.infer<typeof MotivationSchema>
