# FIFA World Cup 2026 API

File-backed REST API and web app for the FIFA World Cup 2026 — 48 teams, group standings, knockout bracket, live scores, stadiums, and official squad lists.

Default deployment:
- No MongoDB
- Source data in `data/source/*.json`
- Public JSON exported to `public/data/*.json`
- Live scores via `/get/games`, `/get/groups`, and `/get/live`

## Web app (Vite + React)

The UI lives in `client/` (React 19 + Vite 6). Production build outputs to `public/` (same URLs as before — Express still serves `public/`).

| Tab | Features |
|-----|----------|
| **Home** | Countdown, stats, hero |
| **Live** | Matches in progress with live badge |
| **Matches** | Schedule by date (list/grid); desktop auto-scrolls to live, today's unfinished, or next fixture; mobile keeps filters and scrolls to the list top |
| **Teams** | 48 team cards; click to open squad modal (head coach + 26 players) |
| **Groups** | Standings for all 12 groups (**A–L**, sorted); click a group for a focus panel with standings + that group's matches |
| **Bracket** | Knockout bracket with SVG connectors; click a team to open group standings with highlight |
| **Stadiums** | 16 host venues with photos |

**Data loading:** `WorldCupProvider` polls `/get/live` every **15s**; squads from `/get/squads` (fallback `/data/squads.json`); teams/stadiums from static JSON. IndexedDB caches all datasets for offline fallback.

**Mobile (≤768px):** fixed tab bar below the header; Groups focus panel portals above the chrome; Bracket scrolls horizontally inside its frame.

### Frontend commands

```bash
# Terminal 1 — API on :3050
npm start

# Terminal 2 — Vite dev server on :5173 (proxies /get and /data)
npm run dev:client

# Production bundle → public/index.html + public/assets/*
npm run build:client
```

`build:client` runs `scripts/gen-client-index.js` (sync SEO head from `public/index.html` → `client/index.html`), Vite build, then `scripts/cleanup-legacy-js.js`.

### Frontend source layout

```text
client/src/
  App.jsx                 # hash routing, header, tab bar
  context/WorldCupContext.jsx
  components/
    HomeTab, LiveTab, MatchesTab, TeamsTab, GroupsTab
    GroupFocusOverlay.jsx # group detail panel
    BracketTab, StadiumsTab, Modals.jsx, GroupTable.jsx, shared.jsx
  lib/                    # matches, bracket, groups, API, IndexedDB, teams
  styles/legacy.css       # app styles (incl. bracket, groups, mobile)
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
npm run build:client   # required once before serving the React UI from public/
npm start
```

Open:
- `http://localhost:3050` — web app
- `http://localhost:3050/api-docs` — Swagger (if `ENABLE_SWAGGER=true`)

For UI development with hot reload, use `npm run dev:client` alongside `npm start` and open `http://localhost:5173`.

> `npm run dev` runs the API on port **3051**. Use `npm start` for the default **3050**.

## Environment

Copy `.env.example` to `.env.development` or `.env.production` to override defaults.

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

Optional live validation tuning: `LIVE_VALIDATE_*` (see `.env.example`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | API on `PORT` (default 3050) |
| `npm run dev` | API on port 3051 |
| `npm run prod` | `NODE_ENV=production` |
| `npm run build:client` | Build React app → `public/` |
| `npm run dev:client` | Vite dev server (:5173) |
| `npm run export:data` | Export `data/source/*.json` → `public/data/` |
| `npm run import:squads` | Fetch squads from Wikipedia → `data/source/squads.json` |
| `npm test` | Unit tests (`scripts/run-tests.js`) |
| `npm run test:load` | Simple HTTP load test (`scripts/load-test.js`) |

### Updating squad data

Official squads are imported from [Wikipedia – 2026 FIFA World Cup squads](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads) (sourced from FIFA). FIFA PDF: [SquadLists-English.pdf](https://fdp.fifa.org/assetspublic/ce281/pdf/SquadLists-English.pdf).

```bash
npm run import:squads   # → data/source/squads.json, public/data/squads.json
```

`import:squads` requires network access. Re-run after FIFA squad changes.

## Data flow

1. `server.js` loads env, bootstraps data, and exports the Express app (Vercel entrypoint + local `npm start`).
2. In file mode, `data/store.js` loads `data/source/*.json` (paths in `data/sourcePaths.js`).
3. `data/store.js` exports browser-ready copies to `public/data/` (teams, games, groups, stadiums, squads).
4. `data/liveSync.js` polls the upstream feed; payloads are validated in `data/validateLiveData.js` before `setLiveData()` writes files.
5. `controllers/getController.js` serves the read API.

## Project structure

```text
worldcup2026/
|-- server.js                 # Express entry (local listen + Vercel export)
|-- lib/
|   |-- expressApp.js         # Express app factory
|   `-- bootstrap.js          # File-mode startup (export + live sync)
|-- vercel.json
|-- config/
|   |-- env.js
|   |-- liveValidate.js
|   `-- swagger.js            # OpenAPI / Swagger UI
|-- controllers/
|   |-- index.js
|   |-- getController.js
|   |-- healthController.js
|   `-- seoController.js
|-- data/
|   |-- source/               # Canonical datasets
|   |   |-- teams.json
|   |   |-- matches.json
|   |   |-- matchtables.json
|   |   |-- stadiums.json
|   |   `-- squads.json
|   |-- import/               # Legacy CSV sources (gitignored)
|   |-- sourcePaths.js
|   |-- store.js
|   |-- liveSync.js
|   `-- validateLiveData.js
|-- tests/
|   `-- api.test.js
|-- scripts/
|   |-- gen-client-index.js
|   |-- cleanup-legacy-js.js
|   |-- import-wikipedia-squads.js
|   |-- load-test.js
|   |-- run-tests.js
|   `-- fetch-stadiums.js
|-- client/                   # Vite + React source
|   |-- src/
|   |-- index.html
|   `-- vite.config.js
|-- public/                   # Built SPA + static assets + exported JSON
|   |-- index.html
|   |-- assets/
|   |-- data/
|   |-- stadiums/{id}.jpg
|   `-- trophy.png
`-- legacy/mongodb/           # Legacy MongoDB stack (not used in file mode)
```

## Notes

- `legacy/mongodb/` holds the old MongoDB stack (auth, donations, imports). It is **not mounted** in file-mode deployment — see `legacy/mongodb/README.md`.
- Frontend is **Vite + React** (`client/`); `npm run build:client` writes hashed bundles to `public/assets/`. English-only UI.
- Live sync validates upstream games/groups (shape, counts, known team IDs) before overwriting local JSON.
- `npm test` runs `scripts/run-tests.js` (no shell globs — works on Windows/PowerShell).
- `GET /health` reports file storage status and memory usage.
- Squad staff lists **head coach only** (Wikipedia/FIFA source).
- On Vercel (`VERCEL=1`), storage is read-only — background file writes are disabled; run `npm run import:squads` locally and commit updated JSON.

## Deploy on Vercel

This project includes a serverless entry point for [Vercel](https://vercel.com).

### Vercel Dashboard settings

| Setting | Value |
|---------|-------|
| Framework Preset | **Other** |
| Root Directory | `.` (repo root) |
| Build Command | `npm run build:client` (set in `vercel.json`) |
| Output Directory | *(leave empty — static files served from `public/` via Express)* |
| Install Command | `npm install` (+ `npm install --prefix client` via `vercel.json`) |
| Node.js Version | **20.x** |

> **Important:** Remove stale **Production Overrides** for Build Command or Output Directory (e.g. `dist`). Wrong overrides cause 404/500 on `/`.

### Environment variables

Set in **Project → Settings → Environment Variables** (Production):

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

1. Import the GitHub repo in the Vercel dashboard.
2. Apply the dashboard settings above.
3. Deploy — Vercel runs `npm run build:client` then serves via `server.js`.

### Routing

Vercel runs `server.js` (via `"main"`) as the Node entrypoint. Express serves:

| URL | Handler |
|-----|---------|
| `/`, `/data/*`, `/stadiums/*`, `/trophy.png` | Static middleware → `public/` |
| `/get/*`, `/health`, `/sitemap.xml`, `/api-docs` | Express API routes |

### How Vercel mode works

- `VERCEL=1` is set automatically → read-only storage (no background file writes).
- Source JSON (`data/source/*.json`) is bundled with the serverless function for API reads.
- Live scores: frontend polls `/get/live`; serverless may fetch from `LIVE_SYNC_URL` on demand (throttled in-memory).
- Local dev uses `app.listen()`; on Vercel the exported Express app handles requests without binding a port.

### Smoke test after deploy

```text
GET /                          → 200 HTML (web app)
GET /data/games.json           → 200 JSON
GET /data/squads.json          → 200 JSON
GET /get/teams                 → 200 JSON
GET /get/team/1                → 200 JSON (Mexico + squad)
GET /get/squad/47              → 200 JSON (Ghana squad)
GET /get/live                  → 200 JSON
GET /health                    → 200 JSON, platform: "vercel"
```

Local development:

```bash
npm start
npm run dev:client   # optional — UI hot reload on :5173
```
