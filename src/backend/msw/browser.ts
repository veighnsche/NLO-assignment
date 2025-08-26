import { setupWorker } from 'msw/browser'
import { handlers } from '@/backend/api.handlers'

export const worker = setupWorker(...handlers)
