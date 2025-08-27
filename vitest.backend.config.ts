import base from './vitest.config'
import { defineConfig, mergeConfig } from 'vitest/config'

export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ['src/backend/**/__tests__/**/*.spec.ts', 'src/backend/**/?(*.)+(spec|test).ts'],
    },
  }),
)
