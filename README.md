# CyberShield — Substation Defense Game

Interactive prototype for the CyberShield project (Taller de Proyectos Interdisciplinarios, Universidad Nacional de Colombia): a browser game and risk simulation of OT cybersecurity in a reference electrical substation.

**Live demo:** _pending first deployment_

## Requirements

- Node.js 20 LTS or newer

## Scripts

| Script                  | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `npm run dev`           | Local development server                               |
| `npm test`              | Run Vitest once                                        |
| `npm run test:watch`    | Vitest in watch mode                                   |
| `npm run lint`          | ESLint                                                 |
| `npm run build`         | Production build for GitHub Pages → `dist/`            |
| `npm run build:offline` | Single self-contained file → `dist-offline/index.html` |
| `npm run preview`       | Preview the production build                           |

## Substation data

The team edits only `src/data/subestacion.json`. Current values are placeholders pending validation by the electrical engineering team.
