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

1. `index.js` loads env config.
2. In file mode, `data/store.js` loads the bundled JSON files.
3. `data/store.js` exports browser-ready copies to `public/data/`.
4. `data/liveSync.js` polls the public feed and rewrites the source JSON snapshots.
5. `controllers/getController.js` serves the public read API.

## Project structure

```text
worldcup2026/
|-- index.js                 # Local Node server entry
|-- lib/expressApp.js        # Express app factory (not app.js — Vercel auto-detects that name)
|-- bootstrap.js             # File-mode startup (export + live sync)
|-- api/index.js             # Vercel serverless entry
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

1. Import the GitHub repo in the Vercel dashboard (or run `vercel` from the CLI).
2. Framework preset: **Other** (no build command required).
3. Install command: `npm install`
4. Output: static files from `public/` are served automatically; API routes are rewritten to `api/index.js`.

Recommended environment variables in the Vercel project settings:

```env
NODE_ENV=production
STORAGE_MODE=file
LIVE_SYNC_ENABLED=true
LIVE_SYNC_URL=https://worldcup26.ir
LIVE_SYNC_INTERVAL_MS=30000
ENABLE_SWAGGER=false
CORS_ORIGINS=*
```

### How Vercel mode works

- `VERCEL=1` is set automatically → read-only storage (no background file writes).
- Static assets (`index.html`, `/data/*.json`, `/stadiums/*.jpg`, `trophy.png`) are served from the CDN.
- Dynamic routes (`/get/*`, `/health`, `/sitemap.xml`, `/api-docs`) run as a serverless Express app.
- Live scores: the frontend polls `/get/live`; on Vercel each request may fetch fresh data from `LIVE_SYNC_URL` (throttled in-memory, no disk writes).

Local development is unchanged:

```bash
npm start
```
