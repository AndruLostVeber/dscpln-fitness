const BASE = 'http://localhost:3000'

function getToken() {
  return localStorage.getItem('accessToken')
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
}

export function clearTokens() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  auth: {
    register: (body: object) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: object) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request<any>('/auth/me'),
    logout: (refreshToken: string) => request<void>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    telegramAuth: (body: { initData: string }) => request<any>('/auth/telegram', { method: 'POST', body: JSON.stringify(body) }),
    updateProfile: (body: object) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },
  ai: {
    chat: (message: string) => request<{ response: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
    history: () => request<any[]>('/ai/history'),
    workoutPlan: (notes?: string) => request<any>('/ai/workout-plan', { method: 'POST', body: JSON.stringify({ notes }) }),
    motivation: (body: { consumedCalories: number; targetCalories: number; consumedProtein: number; targetProtein: number; consumedFat: number; consumedCarbs: number; workoutsThisWeek: number; lastWorkoutDaysAgo?: number }) =>
      request<{ message: string }>('/ai/motivation', { method: 'POST', body: JSON.stringify(body) }),
    foodSuggestions: (body: { want: string; eatenItems: string[]; remainingCalories: number; remainingProtein: number; remainingFat: number; remainingCarbs: number }) =>
      request<any>('/ai/food-suggestions', { method: 'POST', body: JSON.stringify(body) }),
    workoutSuggestions: (body: { focus: string; exerciseCount?: number; setsPerExercise?: number }) =>
      request<any>('/ai/workout-suggestions', { method: 'POST', body: JSON.stringify(body) }),
  },
  workouts: {
    log: (body: object) => request<any>('/workouts', { method: 'POST', body: JSON.stringify(body) }),
    list: () => request<any[]>('/workouts'),
    delete: (id: string) => request<void>(`/workouts/${id}`, { method: 'DELETE' }),
  },
}
