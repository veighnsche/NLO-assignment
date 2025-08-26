# NLO

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

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

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```

---

# Assignment Implementation: Surprise Calendar (100x100)

This app implements the Nederlandse Loterij assignment:

* __[Grid]__ A 100x100 (10,000 cells) grid rendered in `src/frontend/components/GameSection.vue`.
* __[Interaction]__ A user can reveal one cell. The prize appears with a short animation.
* __[Persistence]__ Opened cells and prizes persist across reloads via IndexedDB.
* __[Simulated multi-user]__ A bot periodically reveals cells to emulate other users.

## Quick start

1) Install deps

```sh
pnpm install
```

2) Ensure MSW worker exists (already added to `public/` but command here for reference):

```sh
pnpm dlx msw init public --save
```

3) Run dev server

```sh
pnpm dev
```

4) Verify MSW

* __[Expected]__ Network shows `GET /mockServiceWorker.js` 200 (content-type JavaScript).
* __[Code path]__ `src/main.ts` dynamically imports `src/backend/msw/browser.ts` in dev and starts the worker.

## Recent changes

* __Reusable Modal component__ (`src/frontend/components/ui/Modal.vue`)
  * v-model, ESC/overlay close, focus trap, teleport to body, ARIA attributes, footer slot.
* __Confirmation before reveal__
  * `CalendarGrid.vue` emits `request-reveal` when `confirmBeforeReveal` is true.
  * `GameSection.vue` shows `Modal` to confirm opening a cell, then calls `grid.reveal(...)`.
* __Consistent buttons__
  * `UiButton` (`src/frontend/components/ui/Button.vue`) enhanced with `icon` prop for icon-only buttons.
  * `AdminBar.vue` now uses `UiButton` including icon-only close button.
* __Seamless revealed image__
  * Inner borders removed between adjacent revealed cells in `CalendarGrid.vue` so the background image shows without seams.
* __Header “can open” indicator__
  * `GameHeader.vue` displays whether the user can currently open a cell (`canOpen`).

## Architecture

Directories of interest:

* __`src/backend/`__
  * `api.handlers.ts` — HTTP endpoints (boot, snapshot, reveal, bot step, admin reset). These are the single source of truth for API routes.
  * `db/` — In-memory + IndexedDB-backed data access. Key file: `db/idb.ts`.
  * `msw/browser.ts` — MSW worker setup for the browser (dev only).
  * `msw/server.ts` — MSW server setup for tests (Node/Vitest).

* __`src/frontend/`__
  * `api.ts` — Thin HTTP client for `/api/*` endpoints.
  * `store/grid.ts` — Pinia store for grid state: boot, refresh, reveal, bot polling, single-reveal enforcement.
  * `components/CalendarGrid.vue` — 100x100 cell grid over a two-half background image; emits hover/leave; when `confirmBeforeReveal` is on, emits `request-reveal` instead of revealing directly; revealed cells have no inner borders to keep image seamless.
  * `components/GameSection.vue` — Orchestrates grid, tooltip, confirmation modal flow; computes header metrics and `canOpen`; confirms reveal via `Modal` before calling `grid.reveal`.
  * `components/GameHeader.vue` — Displays counters, grand prize status, and a "Kan openen" chip based on `canOpen`.
  * `components/ui/Modal.vue` — Reusable accessible modal.
  * `components/ui/Button.vue` — Reusable button with variants/sizes and `icon` mode for icon-only buttons.
  * `components/ui/Tooltip.vue` — Positioned tooltip used for hover details.
  * `components/InitScreen.vue` — Simple init/loading screen.
  * `components/TopBar.vue` — App bar.
  * `admin/components/AdminBar.vue` — Admin controls; reset dialog now uses `Modal` and `UiButton`.

* __`public/`__
  * `mockServiceWorker.js` — MSW worker script (served by Vite at `/mockServiceWorker.js`).

Other entry points:

* __`src/main.ts`__ — Starts MSW in dev, mounts Vue app and Pinia.
* __`src/setupTests.ts`__ — Starts MSW server for unit tests.

## API surface

All endpoints are defined once in `src/backend/api.handlers.ts` and mounted by MSW.

* `POST /api/boot` — Initialize state with optional `seed`.
* `GET /api/snapshot` — Current snapshot: meta, revealed cells, counts.
* `POST /api/reveal` — Reveal a cell: `{ id, playerId? }`.
* `POST /api/bot/step` — Deterministic bot reveal step.
* `POST /api/admin/reset` — Reset state; optional `{ mode, seed }`.

Client functions in `src/frontend/api.ts` map 1:1 to these endpoints.

## Behavior details

* __One reveal per visitor__
  * Enforced in store via `localStorage('nlo-user-revealed')`.
  * Cleared on Admin reset to ease demoing.

* __Persistence__
  * `src/backend/db/idb.ts` persists grid + meta to IndexedDB.
  * On boot, state is loaded; frontend hydrates via `snapshot`.

* __Simulated multi-user__
  * `src/App.vue` starts `grid.startBotPolling(1500)` after boot.
  * Each tick calls `/api/bot/step` then refreshes snapshot.

* __Reveal animation__
  * In `GameSection.vue`, revealed content fades/scales in via CSS.

* __Confirmation before reveal__
  * `CalendarGrid.vue` emits `request-reveal` and `GameSection.vue` shows a confirmation `Modal`.

* __Seamless revealed image__
  * Revealed cells remove per-cell borders and prize outlines to avoid seams between adjacent tiles.

* __Header indicator__
  * `GameHeader.vue` shows if user can open a cell now (`canOpen` computed from store state).

## Common troubleshooting

* __MIME type 'text/html' for Service Worker__
  * Ensure `public/mockServiceWorker.js` exists. Generate via `pnpm dlx msw init public --save`.
  * Hard refresh or Unregister SW in DevTools → Application → Service Workers.

* __No cells reveal / NOT_BOOTED__
  * Ensure `apiBoot()` ran on app init (`src/App.vue` → `grid.boot(...)`).

## Tests

Run unit tests:

```sh
pnpm test:unit
```

MSW server auto-starts in `src/setupTests.ts`.

