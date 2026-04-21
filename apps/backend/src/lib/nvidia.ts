import OpenAI from 'openai'

export const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
})

export const NVIDIA_MODELS = {
  chat: 'meta/llama-3.3-70b-instruct',
  fast: 'meta/llama-3.1-8b-instruct',
} as const
