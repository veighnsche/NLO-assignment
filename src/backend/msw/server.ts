import { setupServer } from 'msw/node'
import { handlers } from '@/backend/api.handlers'

export const server = setupServer(...handlers)
