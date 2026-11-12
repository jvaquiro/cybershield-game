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
- Let the user select exactly 3 controls out of the available ones.
- Run the simulation: for each attack route, show how far it gets and which control stops it.
- Show total risk before and after the selected controls.
- Show the best combination of 3 controls (CyberShield's recommendation) and compare it with the user's choice.

### Stage 2 — 1 vs 1 game layer (deadline: Dec 5, 2026)

- Two players on one device: defender and attacker.
- Secret turns with a "pass the device" screen ("Atacante, voltéate").
- The attacker picks an entry point and a route.
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
  id: string;            // e.g. "phishing"
  name: string;          // e.g. "Correo de phishing"
  steps: string[];       // ordered asset ids, from entry point down to the process level
}

interface Control {
  id: string;            // e.g. "segmentation"
  name: string;
  description: string;
  blocks: { routeId: string; stepIndex: number }[]; // steps this control stops
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
  defenderBudget: number; // number of controls the defender can pick (default 3)
}
```

Validation rules (enforced in the schema, with clear error messages):
- Asset, route and control ids are unique.
- Every id in `route.steps` exists in `assets`.
- Every `blocks` entry points to an existing route and a valid step index.
- `outcomes` covers every Purdue level used by the routes.

Placeholder content: create `subestacion.json` from this draft and add `"_status": "PLACEHOLDER - pending validation by electrical team"` at the top level. Show a visible "Datos de prueba" badge in the UI while that field is present.

- Assets: corporate network (L4), SCADA server (L3), contractor VPN (L3), gateway (L2), local HMI (L2), maintenance laptop (L2), 115 kV IEDs (L1), legacy RTU (L1), merging units (L0), breakers and transformers (L0).
- Routes: phishing (corporate → SCADA → gateway → IED → breakers), contractor VPN (VPN → HMI → IED → breakers), maintenance USB (laptop → HMI → merging units → breakers), supply chain (IED firmware → breakers).
- Controls: zone segmentation, two-person authorization for commands, USB policy, contractor access control, legacy isolation, firmware verification.
- Use probability and impact values of 3 everywhere until real values arrive.

**Do not invent technical values and present them as real.** If something is missing, add a `TODO(electrical-team)` comment.

## 7. Engine rules

All functions are pure and fully unit tested.

- `assetRisk(asset) = probability × impact` (range 1–25).
- `simulateRoute(route, selectedControls)` returns the index of the first blocked step (or "not blocked") and the list of assets reached.
- `simulate(data, selectedControlIds)` runs every route and returns, per route: reached assets, blocking control, deepest Purdue level reached.
- `totalRisk(data, selectedControlIds)` = sum of `assetRisk` of every asset reachable by at least one unblocked portion of a route (each asset counted once). Total risk "before" uses no controls.
- `riskReduction` = before − after, also as a percentage.
- `cityOffPercent` = the `outcomes` value for the deepest level reached by any route (Stage 1) or by the chosen route (Stage 2).
- `recommend(data, budget)` evaluates every combination of `budget` controls (brute force; 6 choose 3 = 20) and returns the one with the lowest total risk. Ties: prefer the combination that blocks more routes, then alphabetical order of ids.

Tests must cover: no controls, all routes blocked, partial blocking, ties in `recommend`, and invalid data rejected by the schema.

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
