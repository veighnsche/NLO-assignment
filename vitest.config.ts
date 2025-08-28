import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['src/setupTests.ts'],
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/**'],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 70,
          statements: 80,
        },
        exclude: [
          '**/__tests__/**',
          '**/*.spec.{ts,tsx,js,jsx}',
          'src/setupTests.ts',
          'src/backend/msw/**',
          // Generated or external assets
          'public/**',
          'dist/**',
          '**/mockServiceWorker.js',
          '**/*.gen.*',
          '**/*.generated.*',
          '**/__generated__/**',
          '**/generated/**',
          '**/*.d.ts',
        ],
      },
    },
  }),
)
