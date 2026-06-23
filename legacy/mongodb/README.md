# Legacy MongoDB stack

This directory contains the **pre–file-mode** implementation. It is **not mounted** when `STORAGE_MODE=file` (the default).

## Included (unused in production)

| Path | Purpose |
|------|---------|
| `controllers/` | Auth, Mongo CRUD, donations |
| `models/` | Mongoose schemas |
| `middleware/auth.js` | JWT middleware |
| `database/` | Mongo connection |
| `imports/` | JSON → Mongo import scripts |

## Data sources for imports

Import scripts read canonical JSON from the repo root via `data/sourcePaths.js`:

| File | Path |
|------|------|
| Teams | `data/source/teams.json` |
| Matches | `data/source/matches.json` |
| Groups | `data/source/matchtables.json` |
| Stadiums | `data/source/stadiums.json` |

Legacy CSV files (if any) belong in `data/import/` (gitignored) and are **not** used by file-mode runtime.

## Requirements to run legacy code

- `mongoose`, `bcrypt`, `jsonwebtoken` (not in root `package.json`)
- `STORAGE_MODE=mongodb` and `MONGODB_URL`
- Manual mounting of controllers in `lib/expressApp.js` (removed intentionally)

Run imports from the repo root, for example:

```bash
node legacy/mongodb/imports/import-teams.js
```

## Active deployment (file mode)

Use `data/source/*.json` + `data/store.js` + `/get/*` routes at the repo root.

The web app is **Vite + React** in `client/`; see the root [README.md](../../README.md).

Do not add new features here unless you are explicitly reviving MongoDB mode.
