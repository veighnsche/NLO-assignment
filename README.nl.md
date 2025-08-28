[Nederlands](README.nl.md) | [English](README.md)

# NLO

![Coverage](public/coverage.svg)

Een Vue 3 + Vite project met een 100x100 verrassingskalender, een gemockte backend, deterministische seeding, IndexedDB-persistentie en MSW-gestuurde API.

- Live demo: https://nlo-assignment.pages.dev/

## Technische stack

- Vue 3 + Vite 7 + TypeScript
- Pinia (state), Vue Test Utils + Vitest (tests)
- MSW 2 (API mocking) voor dev/tests
- IndexedDB via `idb` voor persistentie

## Snelstart

1) Dependencies installeren

```sh
pnpm install
```

2) Dev-server starten

```sh
pnpm dev
```

## Snelstart (uitgebreid)

2a) Controleer MSW worker (reeds aanwezig in `public/`, commando hier ter referentie):

```sh
pnpm dlx msw init public --save
```

MSW verifiëren
- Verwacht: Network toont `GET /mockServiceWorker.js` 200 (content-type JavaScript).
- Codepad: `src/main.ts` importeert in dev dynamisch `src/backend/msw/browser.ts` en start de worker.

3) (Optioneel) Productiebuild

```sh
pnpm build
```

## Scripts

- dev: start Vite dev-server
- build: type-check + build
- preview: bekijk productiebuild
- test: Vitest (watch)
- test:run: eenmalig draaien
- test:coverage: tests met coverage (voor badge)
- lint: ESLint met auto-fix
- format: Prettier voor `src/`

## Architectuur

Mappen van belang:

- `src/backend/`
  - `api.handlers.ts` — HTTP-endpoints (boot, snapshot, reveal, bot stap, admin reset). Enige bron van waarheid voor API-routes.
  - `domain/` — Domeinmodellen en logica
    - `grid/` — `schema.ts`, `seed.ts`
    - `users/` — `model.ts`, `generator.ts`
    - `shared/` — `rng.ts`
  - `infra/` — Infra
    - `idb.ts`, `state.ts`, `meta.ts`, `util.ts`
  - `services/` — Orkestratielaag
  - `msw/` — Browser en server setup voor MSW

- `src/frontend/`
  - `App.vue` — App-shell
  - `features/game/` — API-client, componenten (`CalendarGrid.vue`, `GameSection.vue`, `GameMetrics.vue`, `GridTooltip.vue`, `InitScreen.vue`, `RevealModal.vue`), stores en composables
  - `features/admin/` — Adminbalk (`AdminBar.vue`), admin-API, UI-store, `useAdminControls.ts`
  - `features/chrome/` — `TopBar.vue`, `Header.vue`, `Footer.vue`
  - `ui/` — Herbruikbare UI: `Button.vue`, `Modal.vue`, `Tooltip.vue`, `Slider.vue`
  - `styles/` — Globale stijlen: `global.css`, `theme.css`
  - `types/` — Gedeelde types: `api.ts`

- `public/`
  - `mockServiceWorker.js` — MSW worker (geserveerd door Vite op `/mockServiceWorker.js`)

## API-overzicht

- Core
  - `POST /api/boot` — Init met optionele `seed`
  - `GET /api/snapshot` — Huidige snapshot
  - `POST /api/reveal` — Vakje openen `{ id, playerId? }`
  - `POST /api/bot/step` — Deterministische botstap
- Admin
  - `POST /api/admin/reset` — Reset; optioneel `{ seed }`
  - `POST /api/admin/bot-delay` — Botvertraging `{ minMs, maxMs }`
  - `GET /api/admin/bot-delay` — Huidige botvertraging
  - `GET /api/admin/targets` — Doelcellen (hoofdprijs + troostprijzen) tonen voor admin
  - `POST /api/admin/pick-random-player` — Willekeurige geschikte speler kiezen
  - `GET /api/admin/current-player` — Huidige speler ophalen
  - `POST /api/admin/current-player` — Huidige speler instellen `{ playerId|null }`
- Gebruikers
  - `POST /api/users/assign` — Gebruiker aan client koppelen (cookie `nlo-client-id`)
  - `POST /api/users/resolve` — Gebruikersdetails opvragen `{ ids: string[] }`

### Gebruikers — toewijzingssemantiek
- `assignUserForClient(clientId)` levert een deterministische mapping van client-id naar gebruiker. Het filtert niet op geschiktheid (`played === false`).
- Geschiktheid om te spelen wordt elders afgedwongen (bijv. adminselectie via `pickRandomEligibleUser()` / `setCurrentPlayer()` en de reveal-flow).
- Rationale: toewijzing labelt primair een sessie consistent; spel-logica bewaakt het daadwerkelijke spelen.
- Als je enkel geschikte gebruikers wilt toewijzen, filter dan op `!played` vóór selectie.

## Typografie & styling

- Tokens in `src/frontend/styles/theme.css` (lettertypes, gewichten, schalen)
- Globale toepassing in `src/frontend/styles/global.css`
- Responsieve tokens in `breakpoints.css`
- Conventie: gebruik tokens/variabelen, geen hardgecodeerde waarden

## Typografie (globaal) — uitgebreid

- Families
  - UI/body: Nunito Sans (gewichten 400, 600, 700)
  - Display: Fredoka (gewicht 700)
- Laden
  - Geïmporteerd via Google Fonts in `index.html` met `display=swap` en `preconnect`.
  - Alleen benodigde gewichten; subset standaard latin.
- Tokens & schaal
  - Gedefinieerd in `src/frontend/styles/theme.css`:
    - Families: `--font-family-ui`, `--font-family-display`
    - Gewichten: `--font-weight-regular|semibold|bold`
    - Vloeiende groottes: `--fs-h1..--fs-h6`, `--fs-body`, `--fs-small`, `--fs-overline`, `--fs-button`
  - Globaal toegepast in `src/frontend/styles/global.css`:
    - `h1–h3` met Display bold; `h4–h6` UI semibold.
    - Controls erven fonts en gebruiken `--fs-button`.
    - Numeriek: `.num-tabular` en `.num-proportional`.
  
Schaal aanpassen
- Pas tokens aan in `theme.css`. Alle componenten erven hiervan; vermijd component-specifieke font overrides.

Performance & a11y
- Beperk aantal gewichten; gebruik `swap` om CLS te verminderen; sterke fallbacks in font-stacks.
- Verifieer Lighthouse/PSI (CLS stabiel houden). Indien nodig, preload één kritisch gewicht.

## Stylinggids

Gebruik gedeelde designtokens en primitives voordat je nieuwe component-CSS toevoegt. Vermijd ruwe waarden; gebruik tokens uit `src/frontend/styles/theme.css` en responsieve tokens uit `src/frontend/styles/breakpoints.css`.

- __Tokens (`theme.css`)__
  - Kleuren, surfaces, borders, states, typografie, radii, schaduwen, focus.
  - Component-aliases: buttons, adminbalk, modal/overlay, links, speeltoestanden.
  - Dark mode via `.theme-dark` (alleen variabele-overrides).
  - Do: `color: var(--text)`; Don't: `color: #111`.

- __Responsieve tokens (`breakpoints.css`)__
  - Canonieke breakpoints en semantische layoutvariabelen, bijv. `--header-topbar-direction`, `--prize-strip-gap`, `--footer-grid-cols`, `--topbar-height`.
  - Componenten consumeren deze variabelen; herhaal geen media queries per component.

- __Style entry (`index.css`)__
  - Importvolgorde: theme → breakpoints → layout → utilities → global.
  - Element-typografie (`h1–h6`) en form-controls mapping.
  - App-chrome: `#app { padding-top: var(--topbar-height); }`.

- __Primitives & utilities__
  - `utilities.css`: utility classes voor spacing, display, grid, typografie helpers.
  - `layout.css`: canonieke `.container` met `--container-max` en `--container-gutter`.
  - Gebruik `.container` waar mogelijk.

- __Conventies__
  - Gebruik tokens/helpers vóór nieuwe CSS te schrijven.
  - Nieuwe herbruikbare patronen? Voeg toe aan `utilities.css`.
  - App-brede layout spacing? Overweeg een token in `breakpoints.css`.
  - Houd scoped component-CSS minimaal en token-gedreven.

Voorbeeld

```vue
<template>
  <section class="container">
    <h2 class="overline overline--muted">Sectie</h2>
    <div>…</div>
  </section>
  </template>
```

## Tests

```sh
pnpm test       # watch
pnpm test:run   # eenmalig
pnpm test:coverage
```

- MSW server start automatisch in `src/setupTests.ts`
- CI genereert `public/coverage.svg`; badge staat bovenaan dit document

## Coverage (CI)

Genereer lokaal het coverage-rapport (door CI gebruikt voor de badge):

```sh
pnpm test:coverage
```

CI (GitHub Actions: `tests-and-coverage.yml`) leest `coverage/coverage-summary.json`, genereert `public/coverage.svg` en commit dit op `main`/`master`. De badge bovenaan dit document toont de laatste run op de default-branch.
