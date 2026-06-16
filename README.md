# FIFA World Cup 2026 API

File-backed REST API and web app for the FIFA World Cup 2026.

Default deployment:
- No MongoDB
- Source data stored in `football.*.json`
- Public JSON exported to `public/data/*.json`
- Live scores synced through `/get/games` and `/get/groups`

## What runs in file mode

- `GET /get/groups`
- `GET /get/group?name=A`
- `GET /get/teams`
- `GET /get/team/:idTeam`
- `GET /get/games`
- `GET /get/game/:idGame`
- `GET /get/stadiums`
- `GET /get/stadium/:id`
- `GET /get/live`
- `GET /health`
- `GET /api/health`
- `GET /`

## Setup

```bash
npm install
npm start
```

Open:
- `http://localhost:3050`
- `http://localhost:3050/api-docs`

> `npm run dev` runs on port `3051` (auto-reload). Use `npm start` for the default `3050`.

## Environment

Create `.env.development` or `.env.production` if you want to override defaults.

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
npm start
npm run dev
npm run prod
npm run export:data
npm run test:load
```

## Data flow

1. `server.js` loads env, bootstraps data, and exports the Express app (Vercel entrypoint + local `npm start`).
2. In file mode, `data/store.js` loads the bundled JSON files.
3. `data/store.js` exports browser-ready copies to `public/data/`.
4. `data/liveSync.js` polls the public feed and rewrites the source JSON snapshots.
5. `controllers/getController.js` serves the public read API.

## Project structure

```text
worldcup2026/
|-- server.js                # Express entry (local listen + Vercel export)
|-- lib/expressApp.js        # Express app factory
|-- bootstrap.js             # File-mode startup (export + live sync)
|-- vercel.json
|-- config/env.js
|-- controllers/
|   |-- index.js
|   |-- getController.js
|   |-- healthController.js
|   `-- seoController.js
|-- data/
|   |-- store.js
|   `-- liveSync.js
|-- public/
|   |-- index.html
|   |-- data/*.json
|   |-- stadiums/{id}.jpg
|   `-- trophy.png
|-- football.teams.json
|-- football.matches.json
|-- football.matchtables.json
|-- football.stadiums.json
|-- legacy/mongodb/          # Legacy MongoDB code moved out of the runtime tree
`-- swagger.js
```

## Notes

- MongoDB-only controllers, models, middleware, database helpers, and import scripts now live under `legacy/mongodb/` and are not mounted in the default file-only deployment.
- `public/index.html` is the bundled SPA served from `/`.
- `GET /health` reports file storage status and memory usage.

## Deploy on Vercel

This project includes a serverless entry point for [Vercel](https://vercel.com).

### Vercel Dashboard settings

| Setting | Value |
|---------|-------|
| Framework Preset | **Other** |
| Root Directory | `.` (repo root) |
| Build Command | *(leave empty — override ON, no command)* |
| Output Directory | *(leave empty — Vercel auto-serves `public/`)* |
| Install Command | `npm install` |
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
- Source JSON (`football.*.json`) is bundled with the serverless function for API reads.
- Live scores: frontend polls `/get/live`; serverless may fetch fresh data from `LIVE_SYNC_URL` on each request (throttled in-memory).
- Local dev uses `app.listen()`; on Vercel the exported Express app handles requests without listening on a port.

### Smoke test after deploy

```text
GET /                          → 200 HTML (web app)
GET /data/games.json           → 200 JSON
GET /get/teams                 → 200 JSON
GET /get/live                  → 200 JSON
GET /health                    → 200 JSON, platform: "vercel"
```

Local development is unchanged:

```bash
npm start
```
