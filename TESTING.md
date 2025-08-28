[English](TESTING.md) | [Nederlands](TESTING.nl.md)

# Testing Guide

This project uses Vitest + Vue Test Utils for unit tests.

## Commands
- Run tests (watch): `pnpm test`
- Run once (CI/local): `pnpm test:run`
- Coverage report: `pnpm test:coverage` (open `coverage/index.html`)

## Test locations
- Co-located specs under `src/**/__tests__/*.spec.ts`


## Environment
- `vitest.config.ts` sets `environment: jsdom`
- Global test setup: `src/setupTests.ts`
  - `msw` server auto-starts
  - `fake-indexeddb` is installed for IDB APIs

## Running specific tests
- Single file: `pnpm test path/to/spec.spec.ts`
- By pattern: `pnpm test -- -t "test name substring"`

## Common mocking patterns
- Pinia stores: mock modules per test
  ```ts
  vi.mock('@/frontend/features/game/store/grid', () => ({
    useGridStore: () => ({ total: 10, openedCount: 0, userHasRevealed: () => false }),
  }))
  ```
- UI components: stub lightweight templates
  ```ts
  vi.mock('@/frontend/ui/Button.vue', () => ({
    default: { name: 'UiButton', template: '<button @click="$emit(\'click\')"><slot/></button>' },
  }))
  ```
- Re-import with alternate mocks:
  ```ts
  vi.resetModules()
  vi.doMock('module-to-mock', () => ({ /* different implementation */ }))
  const Comp = (await import('../Comp.vue')).default
  ```

## Writing robust DOM assertions
- Prefer role/label queries or class + text checks.
- When checking inline styles produced by Vue, allow for quotes differences, e.g. `url("/asset.png")` vs `url(/asset.png)`.

## MSW usage
- Handlers live under `src/backend/msw/`
- Tests may override handlers via `server.use(...)` inside a spec.

## Adding new tests
- Co-locate spec with component: `Component.vue` -> `__tests__/Component.spec.ts`
- Keep tests focused on public behavior (rendered text/attributes/emits) rather than implementation details.

## Linting
- Run `pnpm lint` to fix common issues.
- Prefer typed mocks; if necessary, cast narrowly instead of `any`.

## CI & Coverage badge
- GitHub Actions workflow `tests-and-coverage.yml` runs `pnpm test:coverage`.
- CI generates `public/coverage.svg` and commits it on `main`/`master`.
- The README shows a local badge referencing that SVG.
