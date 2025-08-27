# NLO

A Vue 3 + Vite project implementing a 100x100 surprise calendar with a mocked backend, deterministic seeding, IndexedDB persistence, and MSW-driven API.

## Tech stack

- Vue 3 + Vite 7 + TypeScript
- Pinia (state), Vue Test Utils + Vitest (tests)
- MSW 2 (API mocking) for dev/tests
- IndexedDB via `idb` for persistence

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```

Run once (no watch):

```sh
pnpm test:unit:run
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```

---

## Features

- **Grid** 100x100 (10,000 cells) rendered in `src/frontend/features/game/components/GameSection.vue`.
- **Interaction** One reveal per user with a short prize animation.
- **Persistence** Opened cells and prizes persist via IndexedDB.
- **Simulated multi-user** A bot periodically reveals cells to emulate other users.

## Quick start

1. Install deps

```sh
pnpm install
```

2. Ensure MSW worker exists (already added to `public/` but command here for reference):

```sh
pnpm dlx msw init public --save
```

3. Run dev server

```sh
pnpm dev
```

4. Verify MSW

- **[Expected]** Network shows `GET /mockServiceWorker.js` 200 (content-type JavaScript).
- **[Code path]** `src/main.ts` dynamically imports `src/backend/msw/browser.ts` in dev and starts the worker.

## Architecture

Directories of interest:

- **`src/backend/`**
  - `api.handlers.ts` — HTTP endpoints (boot, snapshot, reveal, bot step, admin reset). Single source of truth for API routes.
  - `domain/` — Domain models and logic
    - `grid/` — `schema.ts` (types, helpers), `seed.ts` (grid seed + bot reveal order)
    - `users/` — `model.ts` (User), `generator.ts` (deterministic user generation)
    - `shared/` — `rng.ts` (deterministic PRNG utilities)
  - `infra/` — Infrastructure
    - `idb.ts` — IndexedDB config and open helper
    - `state.ts` — In-memory state singletons and accessors
    - `meta.ts` — App meta and counters persistence helpers
    - `util.ts` — Small infra utilities
  - `services/` — Application services orchestrating domain + infra
  - `index.ts` — Backend barrel exports used by handlers
  - `msw/browser.ts` — MSW worker setup for the browser (dev only)
  - `msw/server.ts` — MSW server setup for tests (Node/Vitest)

- **`src/frontend/`**
  - `App.vue` — App shell.
  - `features/game/`
    - `api.ts` — Client for game endpoints.
    - `components/` — `CalendarGrid.vue`, `GameSection.vue`, `GameMetrics.vue`, `GridTooltip.vue`, `InitScreen.vue`, `RevealModal.vue`.
    - `composables/` — `useInitApp.ts`, `useGridCells.ts`, `useGridHoverTooltip.ts`, `useGridTooltip.ts`.
    - `store/` — `grid.ts`, `bot.ts`, `session.ts`, `status.ts`.
  - `features/admin/`
    - `api.ts` — Client for admin endpoints.
    - `components/` — `AdminBar.vue`.
    - `store/` — `adminUI.ts`, `exposed.ts`; `useAdminControls.ts`.
  - `features/chrome/`
    - `components/` — `TopBar.vue`, `Header.vue`, `Footer.vue`.
  - `ui/` — Reusable UI: `Button.vue`, `Modal.vue`, `Tooltip.vue`, `Slider.vue`.
  - `lib/` — Helpers: `http.ts`, `clientId.ts`, `format.ts`, `botSpeed.ts`.
  - `styles/` — Global styles: `global.css`, `theme.css`.
  - `types/` — Shared types: `api.ts`.

- **`public/`**
  - `mockServiceWorker.js` — MSW worker script (served by Vite at `/mockServiceWorker.js`).

Other entry points:

- **`src/main.ts`** — Starts MSW in dev, mounts Vue app and Pinia.
- **`src/setupTests.ts`** — Starts MSW server for unit tests.

## API surface

All endpoints are defined once in `src/backend/api.handlers.ts` and mounted by MSW.

Core:

- `POST /api/boot` — Initialize state with optional `seed`.
- `GET /api/snapshot` — Current snapshot: meta, revealed cells, counts.
- `POST /api/reveal` — Reveal a cell: `{ id, playerId? }`.
- `POST /api/bot/step` — Deterministic bot reveal step.

Admin:

- `POST /api/admin/reset` — Reset state; optional `{ mode: 'soft'|'hard', seed }`.
- `POST /api/admin/bot-delay` — Set bot delay range `{ minMs, maxMs }`.
- `GET /api/admin/bot-delay` — Get current bot delay range.
- `GET /api/admin/targets` — Reveal hidden target cells (grand + consolation) for admin.
- `POST /api/admin/pick-random-player` — Pick a random eligible user.
- `GET /api/admin/current-player` — Get current selected player.
- `POST /api/admin/current-player` — Set current player `{ playerId|null }`.
- `GET /api/admin/eligible-users?offset=&limit=&query=` — Paginated eligible users.

Users:

- `POST /api/users/assign` — Assign or retrieve a user for a client; sets `nlo-client-id` cookie when missing.
- `POST /api/users/resolve` — Resolve user details by ids `{ ids: string[] }`.

Client functions live under `src/frontend/features/game/api.ts` and `src/frontend/features/admin/api.ts`, mapping 1:1 to these endpoints.

## Tests

Run unit tests:

```sh
pnpm test:unit
```

MSW server auto-starts in `src/setupTests.ts`.
