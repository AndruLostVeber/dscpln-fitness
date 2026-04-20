import { z } from 'zod'

const MIN_AGE = 14

function isOldEnough(dob: Date): boolean {
  const today = new Date()
  const age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  return age > MIN_AGE || (age === MIN_AGE && m >= 0)
}

const GenderSchema = z.enum(['male', 'female', 'other'])
const GoalSchema = z.enum(['lose_weight', 'gain_muscle', 'maintain', 'improve_endurance', 'flexibility'])
const FitnessLevelSchema = z.enum(['beginner', 'intermediate', 'advanced'])
const MotivationStyleSchema = z.enum(['light', 'medium', 'hard'])
const ActivityLevelSchema = z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active'])
const DietPreferenceSchema = z.enum(['omnivore', 'vegetarian', 'vegan', 'keto', 'none'])

const dateOfBirthField = z
  .string()
  .refine(s => !isNaN(Date.parse(s)), 'Invalid date')
  .transform(s => new Date(s))
  .refine(isOldEnough, `You must be at least ${MIN_AGE} years old`)

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100),
  dateOfBirth: dateOfBirthField,
  gender: GenderSchema,
  heightCm: z.number().int().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  goal: GoalSchema,
  fitnessLevel: FitnessLevelSchema,
  motivationStyle: MotivationStyleSchema,
  activityLevel: ActivityLevelSchema.optional(),
  workoutsPerWeek: z.number().int().min(1).max(7).optional(),
  injuries: z.array(z.string().max(100)).max(20).optional(),
  dietPreference: DietPreferenceSchema.optional(),
})

export type RegisterInput = z.infer<typeof RegisterSchema>

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type LoginInput = z.infer<typeof LoginSchema>

export const GoogleAuthSchema = z.object({
  googleIdToken: z.string().min(1),
})

export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>

export const RefreshSchema = z.object({
  refreshToken: z.string().uuid(),
})

export type RefreshInput = z.infer<typeof RefreshSchema>

export const UpdateProfileSchema = z.object({
  dateOfBirth: dateOfBirthField.optional(),
  gender: GenderSchema.optional(),
  heightCm: z.number().int().min(100).max(250).optional(),
  weightKg: z.number().min(30).max(300).optional(),
  goal: GoalSchema.optional(),
  fitnessLevel: FitnessLevelSchema.optional(),
  motivationStyle: MotivationStyleSchema.optional(),
  activityLevel: ActivityLevelSchema.optional(),
  workoutsPerWeek: z.number().int().min(1).max(7).optional(),
  injuries: z.array(z.string().max(100)).max(20).optional(),
  dietPreference: DietPreferenceSchema.optional(),
}).refine(data => Object.keys(data).length > 0, 'At least one field required')

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
