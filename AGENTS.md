# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

VEYRON is a full-stack e-commerce platform (Vue.js 3 + TypeScript frontend, Node.js/Express backend, MongoDB database). See `README.md` for architecture details.

### Services

| Service | Port | Start command |
|---------|------|---------------|
| MongoDB | 27017 | `mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017 &` |
| Backend | 3000 | `cd backend && NODE_ENV=development node server.js` |
| Frontend | 5173 | `cd frontend && npx vite --host 0.0.0.0 --port 5173` |

### Critical startup caveats

- **MONGO_URI env var conflict**: A `MONGO_URI` secret may be injected into the environment pointing to a remote/unreachable database. You **must** run `unset MONGO_URI` before starting the backend, so that dotenv loads the local value from `backend/.env.development` (`mongodb://localhost:27017/veyron_db`).
- **Frontend VITE_BASE_URL**: The `frontend/.env.development` must set `VITE_BASE_URL=http://localhost:5173` so that API requests go through the Vite proxy (which forwards `/api` to the backend on port 3000). If `VITE_BASE_URL` is empty or unset, the frontend falls back to a hardcoded remote URL in `src/utils/imageUrl.ts`, causing CORS errors in the browser.
- **Email sending delays**: The backend attempts to send emails on registration/login (SMTP configured in `.env.development`). Without a real SMTP server, these calls will timeout (~10-15s) but fail gracefully. This is normal behavior.
- **MongoDB must be started first** before the backend, otherwise `connectDB()` will exit the process.

### Standard commands

- **Backend tests**: `cd backend && npm test` (Jest + mongodb-memory-server; no external MongoDB needed)
- **Frontend lint**: `cd frontend && npx eslint .`
- **Frontend type-check**: `cd frontend && npx vue-tsc --build`
- **Frontend unit tests**: `cd frontend && npx vitest run` (pre-existing config incompatibility with callback-form vite.config.ts)

### Pre-existing issues in codebase

- Some backend tests fail due to password validation constraints (minimum 12 characters) not met in test fixtures.
- Frontend vitest has a startup error: `Cannot merge config in form of callback` because `vite.config.ts` exports a function, incompatible with `vitest.config.ts` which uses `mergeConfig`.
- Frontend has pre-existing ESLint errors and TypeScript type-check errors.
- Registration page (`/register`) has a `ReferenceError: useValidation is not defined` bug.
