# FIFA World Cup 2026 API

File-backed REST API and web app for the FIFA World Cup 2026 — 48 teams, group standings, knockout bracket, live scores, stadiums, and official squad lists.

Default deployment:
- No MongoDB
- Source data stored in `data/source/*.json`
- Public JSON exported to `public/data/*.json`
- Live scores synced through `/get/games` and `/get/groups`

## Web app (Vite + React)

The UI lives in `client/` (React 19 + Vite 6). Production build outputs to `public/` (same URL as before — Express still serves `public/`).

| Tab | Features |
|-----|----------|
| **Home** | Countdown, stats, hero |
| **Live** | Matches in progress with live badge |
| **Matches** | Schedule by date; auto-scrolls to live, today's unfinished, or next upcoming fixture |
| **Teams** | 48 team cards; click to open squad modal (head coach + 26 players) |
| **Groups** | Standings for all 12 groups (**A–L**, sorted) |
| **Bracket** | Knockout bracket; click a team to open group standings with highlight |
| **Stadiums** | 16 host venues with photos |

**Data loading:** `WorldCupProvider` polls `/get/live` every **15s**; squads from `/get/squads` (fallback `/data/squads.json`); teams/stadiums from static JSON. IndexedDB caches all datasets for offline fallback.

### Frontend commands

```bash
# API on :3050, Vite dev server on :5173 (proxies /get and /data)
npm start
npm run dev:client

# Production bundle → public/index.html + public/assets/*
npm run build:client
```

Source layout:

```
client/src/
  App.jsx              # hash routing, header, tabs
  context/             # data + live polling
  components/          # tab panels, modals, match cards
  lib/                 # matches, bracket, API, IndexedDB
  styles/legacy.css    # original SPA styles
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/get/groups` | All group standings (sorted A–L) |
| `GET` | `/get/group?name=A` | Single group by letter |
| `GET` | `/get/teams` | All teams (`?group=A` optional) |
| `GET` | `/get/team/:idTeam` | Team info + squad |
| `GET` | `/get/squads` | All squads (coach + 26 players per team) |
| `GET` | `/get/squad/:idTeam` | Squad only (coach + 26 players) |
| `GET` | `/get/team?name=Mexico` | Team by English name (no squad) |
| `GET` | `/get/games` | All matches |
| `GET` | `/get/game/:idGame` | Single match |
| `GET` | `/get/stadiums` | All stadiums |
| `GET` | `/get/stadium/:id` | Single stadium |
| `GET` | `/get/live` | Live score snapshot |
| `GET` | `/health` | Storage status + memory |
| `GET` | `/api/health` | Alias for `/health` |
| `GET` | `/` | Web app |
| `GET` | `/api-docs` | Swagger UI (when enabled) |

### Squad response shape

```json
{
  "team": { "id": "1", "name_en": "Mexico", "fifa_code": "MEX", "groups": "A" },
  "squad": {
    "team_id": "1",
    "staff": [{ "role": "Head Coach", "name": "Javier Aguirre" }],
    "players": [
      { "number": 1, "name": "Raúl Rangel", "position": "GK", "club": "Guadalajara" }
    ]
  }
}
```

Each squad has **26 players** (official FIFA list) sorted by position (GK → DEF → MID → FWD) then shirt number.

## Setup

```bash
npm install
npm start
```

Open:
- `http://localhost:3050` — web app
- `http://localhost:3050/api-docs` — Swagger (if `ENABLE_SWAGGER=true`)

> `npm run dev` runs on port **3051**. Use `npm start` for the default **3050**.

## Environment

Create `.env.development` or `.env.production` to override defaults.

```env
NODE_ENV=development
PORT=3050

STORAGE_MODE=file

LIVE_SYNC_ENABLED=true
LIVE_SYNC_URL=https://worldcup26.ir
LIVE_SYNC_INTERVAL_MS=30000

ENABLE_SWAGGER=true
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=500
CORS_ORIGINS=*
```

## Scripts

```bash
npm start              # Local server on PORT (default 3050)
npm run dev            # Development on port 3051
npm run prod           # NODE_ENV=production
npm run export:data    # Export data/source/*.json → public/data/
npm run import:squads  # Fetch official squads from Wikipedia (FIFA-sourced)
npm test               # Unit tests (store, live payload validation)
npm run test:load      # Simple load test
```

### Updating squad data

Official squads are imported from [Wikipedia – 2026 FIFA World Cup squads](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads) (sourced from FIFA). FIFA PDF: [SquadLists-English.pdf](https://fdp.fifa.org/assetspublic/ce281/pdf/SquadLists-English.pdf).

```bash
npm run import:squads   # → data/source/squads.json, public/data/squads.json
```

`import:squads` requires network access. Re-run after FIFA squad changes.

## Data flow

1. `server.js` loads env, bootstraps data, and exports the Express app (Vercel entrypoint + local `npm start`).
2. In file mode, `data/store.js` loads bundled `data/source/*.json` files.
3. `data/store.js` exports browser-ready copies to `public/data/` (teams, games, groups, stadiums, squads).
4. `data/liveSync.js` polls the public feed; payloads are validated in `data/validateLiveData.js` before `setLiveData()` writes files.
5. `controllers/getController.js` serves the read API.

## Project structure

```text
worldcup2026/
|-- server.js                 # Express entry (local listen + Vercel export)
|-- lib/
|   |-- expressApp.js       # Express app factory
|   `-- bootstrap.js        # File-mode startup (export + live sync)
|-- vercel.json
|-- config/
|   |-- env.js
|   |-- liveValidate.js
|   `-- swagger.js          # OpenAPI / Swagger UI
|-- controllers/
|   |-- index.js
|   |-- getController.js
|   |-- healthController.js
|   `-- seoController.js
|-- data/
|   |-- source/             # Canonical datasets (teams, matches, groups, …)
|   |   |-- teams.json
|   |   |-- matches.json
|   |   |-- matchtables.json
|   |   |-- stadiums.json
|   |   `-- squads.json
|   |-- sourcePaths.js      # Shared paths for store + scripts
|   |-- store.js
|   |-- liveSync.js
|   `-- validateLiveData.js # Reject bad upstream live payloads
|-- tests/
|   `-- api.test.js         # node:test — store + validation
|-- scripts/
|   |-- import-wikipedia-squads.js
|   |-- load-test.js
|   `-- fetch-stadiums.js
|-- client/                 # Vite + React source
|   |-- src/
|   |   |-- App.jsx
|   |   |-- context/WorldCupContext.jsx
|   |   |-- components/
|   |   |-- lib/
|   |   `-- styles/legacy.css
|   |-- index.html          # dev shell (SEO head synced from public on build)
|   `-- vite.config.js
|-- public/
|   |-- index.html          # built SPA (Vite output)
|   |-- assets/             # hashed JS/CSS bundles
|   |-- data/               # exported JSON for browser + CDN
|   |-- stadiums/{id}.jpg
|   `-- trophy.png
`-- legacy/mongodb/         # Legacy MongoDB code (not used in file mode)
```

## Notes

- `legacy/mongodb/` holds the old MongoDB stack (auth, donations, imports). It is **not mounted** in file-mode deployment — see `legacy/mongodb/README.md`.
- Frontend is **Vite + React** (`client/`); `npm run build:client` writes bundles to `public/`. English-only UI.
- Live sync validates upstream games/groups (shape, counts, known team IDs) before overwriting local JSON. Tune via `LIVE_VALIDATE_*` in `.env.example`.
- `npm test` runs `scripts/run-tests.js` (no shell globs — works on Windows/PowerShell).
- `GET /health` reports file storage status and memory usage.
- Squad staff currently lists **head coach only** (Wikipedia/FIFA source); assistant coaches are not in the public squad lists.
- On Vercel (`VERCEL=1`), storage is read-only — live sync writes are disabled; run `npm run import:squads` locally and commit updated JSON.

## Deploy on Vercel

This project includes a serverless entry point for [Vercel](https://vercel.com).

### Vercel Dashboard settings

| Setting | Value |
|---------|-------|
| Framework Preset | **Other** |
| Root Directory | `.` (repo root) |
| Build Command | `npm run build:client` (also set in `vercel.json`) |
| Output Directory | *(leave empty — Vercel auto-serves `public/`)* |
| Install Command | `npm install` (Vercel also runs `npm install --prefix client` via `vercel.json`) |
| Node.js Version | **20.x** |

> **Important:** If you see a yellow **Production Overrides** banner, remove any override for Build Command or Output Directory (e.g. `dist`). Those stale overrides cause 404/500 on `/`.

### Environment variables

Set these in **Project → Settings → Environment Variables** (Production):

```env
NODE_ENV=production
STORAGE_MODE=file
LIVE_SYNC_ENABLED=true
LIVE_SYNC_URL=https://worldcup26.ir
LIVE_SYNC_INTERVAL_MS=30000
ENABLE_SWAGGER=false
CORS_ORIGINS=*
```

### Deploy steps

1. Import the GitHub repo (`engerars/worldcup2026`) in the Vercel dashboard.
2. Apply the dashboard settings above.
3. Deploy — no build step required.

### Routing

Vercel runs `server.js` (via `"main"`) as the Node entrypoint. Express serves everything:

| URL | Handler |
|-----|---------|
| `/`, `/data/*`, `/stadiums/*`, `/trophy.png` | Express static middleware → `public/` |
| `/get/*`, `/health`, `/sitemap.xml`, `/api-docs` | Express API routes |

### How Vercel mode works

- `VERCEL=1` is set automatically → read-only storage (no background file writes).
- Source JSON (`data/source/*.json`) is bundled with the serverless function for API reads.
- Live scores: frontend polls `/get/live`; serverless may fetch fresh data from `LIVE_SYNC_URL` on each request (throttled in-memory).
- Local dev uses `app.listen()`; on Vercel the exported Express app handles requests without listening on a port.

### Smoke test after deploy

```text
GET /                          → 200 HTML (web app)
GET /data/games.json           → 200 JSON
GET /data/squads.json          → 200 JSON (48 teams)
GET /get/teams                 → 200 JSON
GET /get/team/1                → 200 JSON (Mexico + squad)
GET /get/squad/47              → 200 JSON (Ghana squad)
GET /get/live                  → 200 JSON
GET /health                    → 200 JSON, platform: "vercel"
```

Local development is unchanged:

```bash
npm start
```
