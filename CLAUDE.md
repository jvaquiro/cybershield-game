# CyberShield — Substation Defense Game

Project brief for Claude Code. Read this file fully before writing any code.

## 1. Context

CyberShield is a student project (Taller de Proyectos Interdisciplinarios, Universidad Nacional de Colombia) that proposes a methodology to diagnose and strengthen OT cybersecurity in Colombian electrical substations without interrupting operation.

This repository contains the **interactive prototype**: a browser game where an attacker tries to reach a substation's process level and a defender places a limited number of security controls. Its engine calculates the risk before and after the defenses, so the game doubles as a **risk simulation** of a reference substation ("subestación tipo").

The technical data (assets, attack routes, controls, probability and impact values) is **still being defined by the electrical engineering team**. Until it arrives, use clearly marked placeholder data (see section 6).

## 2. Scope

### Stage 1 — Simulation engine (deadline: Nov 22, 2026)

- Load the substation data from a JSON file and validate it.
- Show the substation map by Purdue level (0 to 4).
- Let the user select exactly `defenderBudget` controls (currently **1**).
- Run the simulation: for each attack route, show how far it gets and which control stops it.
- Show total risk before and after the selected controls.
- Show the best choice of controls (CyberShield's recommendation) and compare it with the user's choice.

### Stage 2 — 1 vs 1 game layer (deadline: Dec 5, 2026)

- Two players on one device: defender and attacker.
- Secret turns with a "pass the device" screen ("Atacante, voltéate").
- The defender secretly picks 1 control; then the attacker secretly picks 1 route (like a penalty kick).
- If the chosen control blocks a step of the chosen route, the attack stops there; otherwise it reaches the process level.
- Animated attack moving down the levels; city lights turning off according to the deepest level reached.
- Final screen with the risk calculation and CyberShield's recommendation.
- Kiosk mode: return to the start screen after 30 s of inactivity.
- Local ranking of "cities saved".

### Out of scope

- Backend, accounts, or any network calls at runtime.
- Hardware integration (ESP32 / physical model). Do not build it, but keep the engine output easy to export later.

**Work on Stage 1 only until it is complete and tested.** Do not start Stage 2 unless asked.

## 3. Hard constraints

- **Works fully offline.** No CDNs, no Google Fonts, no external APIs at runtime. Use system fonts or self-hosted font files.
- **Two build outputs** (see section 8): a hosted version for GitHub Pages and a single self-contained `index.html` for the fair.
- **Target screens:** laptop 1366×768 and 10" tablet in landscape. Touch-first: tap targets of at least 48 px, no hover-only interactions.
- **UI language: Spanish.** Code, comments, commit messages and identifiers: English.
- **Deterministic engine:** same input, same output. No randomness inside the engine. If Stage 2 needs randomness, use a seeded RNG in the UI layer.
- **Readable at 1 m distance** (fair booth): base font size at least 18 px on the game screens.

## 4. Tech stack

| Concern | Choice |
|---|---|
| Runtime | Node.js 20 LTS or newer |
| Build tool | Vite |
| UI | React + TypeScript (`strict: true`) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| Graphics | Inline SVG React components (no canvas, no game engine) |
| Animation (Stage 2 only) | `motion` (Framer Motion) |
| Data validation | `zod` |
| Tests | Vitest |
| Lint and format | ESLint + Prettier |
| Offline build | `vite-plugin-singlefile` |
| Hosting | GitHub Pages, deployed by GitHub Actions |

Ask before adding any dependency not listed here.

## 5. Project structure

```
cybershield-game/
├─ CLAUDE.md
├─ README.md
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ .github/workflows/deploy.yml
├─ public/
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ data/
   │  ├─ subestacion.json        # substation data (edited by the team)
   │  └─ schema.ts               # zod schema + inferred TypeScript types
   ├─ engine/                    # pure logic, no React imports
   │  ├─ risk.ts
   │  ├─ simulation.ts
   │  ├─ recommendation.ts
   │  └─ __tests__/
   ├─ ui/
   │  ├─ screens/                # Start, Map, Defense, Result (Stage 1)
   │  ├─ components/             # SubstationMap, ControlPicker, RiskPanel, ...
   │  └─ theme.ts                # colors and sizes
   └─ i18n/es.ts                 # all Spanish UI strings in one place
```

Rules:
- `engine/` never imports from `ui/` or React.
- All UI text lives in `i18n/es.ts`, never hard-coded in components.
- The team must be able to change substation data by editing only `subestacion.json`.

## 6. Data model (placeholder until the electrical team confirms)

Define these types in `src/data/schema.ts` with zod. Field names are final; **values are not**.

```ts
type PurdueLevel = 0 | 1 | 2 | 3 | 4;

interface Asset {
  id: string;            // e.g. "hmi"
  name: string;          // Spanish display name
  level: PurdueLevel;
  protocol: string;      // e.g. "DNP3"
  probability: 1 | 2 | 3 | 4 | 5; // likelihood of compromise
  impact: 1 | 2 | 3 | 4 | 5;      // impact on service continuity
  description: string;   // one short line for the info card
}

interface Route {
  id: string;            // e.g. "remote"
  name: string;          // e.g. "Acceso remoto (phishing)"
  entry: string;         // how the attacker gets in, e.g. "Correo de phishing"
  steps: string[];       // ordered asset ids the attacker reaches, down to the process level
}

interface Control {
  id: string;            // e.g. "segmentation"
  name: string;
  description: string;
  // stepIndex = the attacker is stopped BEFORE reaching route.steps[stepIndex].
  // stepIndex 0 means the attacker is stopped at the entry point and reaches no asset.
  blocks: { routeId: string; stepIndex: number }[];
}

interface Outcome {
  level: PurdueLevel;    // deepest level reached by the attack
  cityOffPercent: number; // 0–100
}

interface SubstationData {
  name: string;
  assets: Asset[];
  routes: Route[];
  controls: Control[];
  outcomes: Outcome[];
  defenderBudget: number; // number of controls the defender can pick (currently 1)
}
```

Validation rules (enforced in the schema, with clear error messages):
- Asset, route and control ids are unique.
- Every id in `route.steps` exists in `assets`.
- Every `blocks` entry points to an existing route and a valid step index.
- `outcomes` covers every Purdue level used by the routes.

Placeholder content: create `subestacion.json` from this draft and add `"_status": "PLACEHOLDER - pending validation by electrical team"` at the top level. Show a visible "Datos de prueba" badge in the UI while that field is present.

The game structure below was **agreed with the electrical team** (a deliberately simple version, focused on the human factor). Only the probability, impact and outcome values are still placeholders.

Assets (5):

| id | Spanish name | Level |
|---|---|---|
| `corporate` | Red corporativa | 4 |
| `scada` | Servidor SCADA | 3 |
| `hmi` | HMI local | 2 |
| `ied` | IED de 115 kV | 1 |
| `breakers` | Interruptores | 0 |

Routes (2):

| id | Spanish name | Entry | Steps |
|---|---|---|---|
| `remote` | Acceso remoto | Correo de phishing | `corporate` → `scada` → `ied` → `breakers` |
| `local` | Acceso local | USB o actualización de software | `hmi` → `ied` → `breakers` |

Controls (4):

| id | Spanish name | Blocks |
|---|---|---|
| `segmentation` | Segmentación por zonas | `remote`, stepIndex 1 (before SCADA) |
| `dual-auth` | Doble autorización de mandos | `remote`, stepIndex 3 (before breakers) |
| `usb-policy` | Política de USB | `local`, stepIndex 0 (before HMI) |
| `firmware-check` | Verificación de firmware | `local`, stepIndex 1 (before IED) |

- `defenderBudget`: 1.
- Probability and impact (validated by the electrical team, scale 1–4): `corporate` P4 I3, `scada` P3 I4, `hmi` P4 I4, `ied` P3 I4, `breakers` P3 I4.
- Outcomes (placeholder): attack stops at level 2 or above → 0 % of the city off; reaches level 1 → 30 %; reaches level 0 → 100 %. `TODO(electrical-team)`.

Design intent: each route has one early control and one late control. Blocking early protects more assets, so the choice of control matters. The data must allow adding more assets, routes and controls later without code changes.

**Do not invent technical values and present them as real.** If something is missing, add a `TODO(electrical-team)` comment.

## 7. Engine rules

All functions are pure and fully unit tested.

- `assetRisk(asset) = probability × impact` (range 1–25).
- `simulateRoute(route, selectedControls)` returns the lowest blocked `stepIndex` among the selected controls (or "not blocked") and the list of assets reached (`steps` before that index; all steps if not blocked).
- `simulate(data, selectedControlIds)` runs every route and returns, per route: reached assets, blocking control, deepest Purdue level reached.
- `routeRisk(route, selectedControls, assets)` = sum of `assetRisk` of the assets the attacker reaches on that route (`assets` is needed to look up probability and impact).
- `totalRisk(data, selectedControlIds)` = sum of `routeRisk` over all routes. An asset shared by two routes counts once per route that reaches it, because each route is a separate attack scenario. Total risk "before" uses no controls. (With the current data: before = 48 + 40 = 88.)
- `riskReduction` = before − after, also as a percentage.
- `cityOffPercent(data, selectedControlIds)` is computed **per route**: for each route, the `outcomes` value for the deepest level that route reaches (0 if it reaches no asset). Each route is a separate scenario ("if the attacker enters this way"), never the worst route overall, which would always give 0 % lit with budget 1. Stage 1 shows one skyline per route with `100 − cityOffPercent` lit; Stage 2 uses the chosen route only (via `duel`).
- `recommend(data, budget)` evaluates every combination of `budget` controls (brute force; with the current data, 4 combinations) and returns the one with the lowest total risk. Ties: prefer the combination that blocks more routes, then the one that blocks earlier (lower `stepIndex`), then alphabetical order of ids.
- Stage 2 (1 vs 1): `duel(data, controlId, routeId)` simulates only the chosen route with the chosen control and returns the assets reached, the deepest level and `cityOffPercent`.

Tests must cover: no controls, a route blocked at stepIndex 0, a route blocked late, a control that does not touch the chosen route, ties in `recommend`, and invalid data rejected by the schema.

## 8. Builds and deployment

Scripts in `package.json`:

| Script | Purpose |
|---|---|
| `npm run dev` | Local development server |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint |
| `npm run build` | Production build for GitHub Pages (`base` = `/<repo-name>/`) |
| `npm run build:offline` | Single-file build with `vite-plugin-singlefile` (`base` = `./`), output in `dist-offline/index.html` |
| `npm run preview` | Preview the production build |

GitHub Actions (`.github/workflows/deploy.yml`): on push to `main`, install, run tests, build, and deploy `dist/` to GitHub Pages. A failing test must block the deployment.

The offline file must open by double-clicking it in Chrome or Edge with no internet connection. Verify this before calling the build done.

## 9. Visual style

- Control-room look: dark navy background, cyan accents, red for attack, green for blocked, warm yellow for city lights.
- Define every color once in `ui/theme.ts`.
- One idea per screen; no long paragraphs. Info cards: two lines maximum.

## 10. Definition of done — Stage 1

- [ ] Project created with the stack above; lint and tests pass.
- [ ] `subestacion.json` loads and is validated; invalid data shows a readable error.
- [ ] Map shows every asset by Purdue level; tapping an asset opens its info card.
- [ ] User can pick exactly `defenderBudget` controls.
- [ ] Simulation shows each route's progress and the blocking control.
- [ ] Risk before, after and reduction are displayed.
- [ ] CyberShield's recommendation is displayed and compared with the user's choice.
- [ ] Engine unit tests pass.
- [ ] GitHub Pages deployment works and the URL is in `README.md`.
- [ ] `build:offline` produces a single `index.html` that works without internet.

## 11. How to work in this repo

1. Start with the project setup and the GitHub Pages pipeline, so a live URL exists from day one.
2. Then the schema and placeholder data, then the engine with tests, then the UI.
3. Make small commits with clear messages.
4. Run `npm test` and `npm run lint` before every commit.
5. When the real data from the electrical team arrives, only `subestacion.json` should need to change.
