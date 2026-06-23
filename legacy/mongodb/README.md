# Legacy MongoDB stack

This directory contains the **pre–file-mode** implementation. It is **not mounted** when `STORAGE_MODE=file` (the default).

## Included (unused in production)

| Path | Purpose |
|------|---------|
| `controllers/` | Auth, Mongo CRUD, donations |
| `models/` | Mongoose schemas |
| `middleware/auth.js` | JWT middleware |
| `database/` | Mongo connection |
| `imports/` | CSV/JSON → Mongo import scripts |

## Requirements to run legacy code

- `mongoose`, `bcrypt`, `jsonwebtoken` (not in root `package.json`)
- `STORAGE_MODE=mongodb` and `MONGODB_URL`
- Manual mounting of controllers in `lib/expressApp.js` (removed intentionally)

## Active deployment

Use `data/source/*.json` + `data/store.js` + `/get/*` routes at the repo root.

Do not add new features here unless you are explicitly reviving MongoDB mode.
