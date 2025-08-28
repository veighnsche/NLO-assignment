[Nederlands](TESTING.nl.md) | [English](TESTING.md)

# Testgids

Dit project gebruikt Vitest + Vue Test Utils voor unittests.

## Commando's
- Tests draaien (watch): `pnpm test`
- Eenmalig (CI/lokaal): `pnpm test:run`
- Coverage rapport: `pnpm test:coverage` (open `coverage/index.html`)

## Locatie van tests
- Co-located specs onder `src/**/__tests__/*.spec.ts`

## Testomgeving
- `vitest.config.ts` zet `environment: jsdom`
- Globale test-setup: `src/setupTests.ts`
  - `msw` server start automatisch
  - `fake-indexeddb` is geïnstalleerd voor IDB API's

## Specifieke tests draaien
- Enkel bestand: `pnpm test path/to/spec.spec.ts`
- Op patroon: `pnpm test -- -t "test name substring"`

## Veelgebruikte mockingpatronen
- Pinia stores: mock modules per test
  ```ts
  vi.mock('@/frontend/features/game/store/grid', () => ({
    useGridStore: () => ({ total: 10, openedCount: 0, userHasRevealed: () => false }),
  }))
  ```
- UI componenten: stub lichte templates
  ```ts
  vi.mock('@/frontend/ui/Button.vue', () => ({
    default: { name: 'UiButton', template: '<button @click="$emit(\'click\')"><slot/></button>' },
  }))
  ```
- Opnieuw importeren met alternatieve mocks:
  ```ts
  vi.resetModules()
  vi.doMock('module-to-mock', () => ({ /* andere implementatie */ }))
  const Comp = (await import('../Comp.vue')).default
  ```

## Robuuste DOM-asserties
- Geef de voorkeur aan role/label queries of class + tekst checks.
- Bij inline styles van Vue: sta verschil in quotes toe, bijv. `url("/asset.png")` vs `url(/asset.png)`.

## MSW gebruik
- Handlers staan onder `src/backend/msw/`
- Tests kunnen handlers overschrijven via `server.use(...)` in een spec.

## Nieuwe tests toevoegen
- Zet de spec naast de component: `Component.vue` -> `__tests__/Component.spec.ts`
- Focus op publiek gedrag (gerenderde tekst/attributen/emits), niet op implementatiedetails.

## Linting
- Draai `pnpm lint` om veelvoorkomende issues te fixen.
- Gebruik getypeerde mocks; cast zo smal mogelijk, vermijd `any`.

## CI & Coverage-badge
- GitHub Actions workflow `tests-and-coverage.yml` draait `pnpm test:coverage`.
- CI genereert `public/coverage.svg` en commit dit op `main`/`master`.
- De README toont een lokale badge die naar die SVG verwijst.
