import 'fake-indexeddb/auto'
import { beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '@/backend/msw/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))

afterEach(() => server.resetHandlers())

afterAll(() => server.close())
