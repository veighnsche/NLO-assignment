import base from './vitest.config'
import { defineConfig, mergeConfig } from 'vitest/config'

export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ['src/frontend/**/__tests__/**/*.spec.ts', 'src/frontend/**/?(*.)+(spec|test).ts'],
      coverage: {
        include: ['src/frontend/**'],
      },
    },
  }),
)
