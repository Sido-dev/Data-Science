# Data Science Learning Workspace — v2

A React/Vite learning workspace for analyst and scientist tracks, with a FastAPI/SQLAlchemy backend for optional private cloud backup and validated curriculum publishing. The active UI is `frontend/src/learning/LearningApp.jsx`; `frontend/src/App.jsx` exports it.

Progress is saved in the browser by default. An account is optional and uses a **username and password**, not the older email-only login. The old roadmap/activity routers are not mounted by the current backend. Existing legacy database tables are not automatically migrated into v2 learning accounts or browser progress.

## Current behavior

- Choose a track, weekly study hours and experience level; work through modules, questions, exercises and projects.
- Save completed modules, notes, answers, project milestones, exercise drafts and recent activity locally.
- Export a JSON backup, preview an imported/cloud backup, then explicitly choose whether to restore it.
- Optionally register/sign in under Settings & backup, upload this browser's progress, or preview a cloud backup. This is explicit backup/restore, not continuous automatic cross-device sync.
- Validate/export curriculum JSON locally, or publish through the content screen using a server-side admin key. Opening `/admin` does not itself grant publishing permission.

## Local setup

The API tests for this update were run on Python 3.12.14 with the versions in `docs/VERIFICATION.md`. Use a separate virtual environment.

From the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements-dev.txt
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

On POSIX systems activate with `source .venv/bin/activate` before entering `backend/`.

In another terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to `http://127.0.0.1:8000`. The frontend's checked-in lockfile is used by `npm ci`. The backend defaults to `sqlite:///./learning_tracker.db`, relative to its working directory, and creates the v2 tables on startup. It does not seed the historical 168-day roadmap. Back up an existing database before changing deployments.

Browser-only learning does not require an account/backend. Backend cloud operations require connectivity. Frontend state and backend API tests are separate checks.

## Environment configuration

`backend/.env.example` documents the settings; the application does **not** automatically load that file. Set values in your shell or hosting environment.

| Variable | Location | Meaning |
|---|---|---|
| `DATABASE_URL` | backend | SQLAlchemy connection URL; defaults to a local SQLite file. `postgres://` is normalized to `postgresql://`. |
| `ALLOWED_ORIGINS` | backend | Comma-separated exact frontend origins, including scheme and optional port; no wildcard Vercel domain matching. |
| `ADMIN_KEY` | backend | At least 32 characters; use a generated secret for curriculum publishing. Never expose it in a `VITE_` setting or commit it. |
| `VITE_API_URL` | frontend build | Backend origin without `/api/v2`; the client appends that path. Rebuild/redeploy after changing it. |

With no `VITE_API_URL` in a hosted production build, the UI keeps browser backup/import/export available and cloud backup is not configured. Development uses the Vite proxy.

## API v2

| Method | Path | Access / behavior |
|---|---|---|
| GET | `/` | Process/service response with version 2.0.0; not a full database-readiness assertion |
| POST | `/api/v2/auth/register` | Username/password; 201 returns token and normalized username |
| POST | `/api/v2/auth/login` | Username/password; returns a new token |
| POST | `/api/v2/auth/logout` | Bearer token; invalidates that session |
| GET | `/api/v2/progress` | Bearer token; returns only that account's backup or null |
| PUT | `/api/v2/progress` | Bearer token; validated `{"workspace": {...}}` |
| GET | `/api/v2/content` | Public published curriculum, or the bundled JSON fallback |
| PUT | `/api/v2/content` | `X-Admin-Key`; validates curriculum before replacing published content |

Usernames contain 3–40 letters/digits/underscores and are normalized to lowercase. Password length is 12–128 characters. Session tokens expire after seven days; the backend stores token hashes. The frontend keeps its signed-in account token in session storage. Login/registration attempts have process-local limits of 20 per five minutes for both IP and normalized account. Requests over 2,000,000 bytes are rejected; backups and curriculum also have their own structural/serialized-size checks.

Typical error statuses are 401 for missing/invalid/expired sessions, 403 for publishing without a valid admin key, 409 for duplicate usernames, 413 for excessive request bytes, 422 for invalid payloads, and 429 for authentication throttling.

## Tests

Run from the repository root after installing backend dev requirements:

```powershell
python -m pytest -q backend/tests backend/test_models.py
```

The suite forces disposable in-memory SQLite databases, overrides the database dependency, and resets rate-limit state per test. It never connects to a real `DATABASE_URL`. The old `backend/test_models.py` print-only table creation script is replaced with real assertions on a disposable schema; running it is not required for application startup.

Coverage includes registration, password/token hashing, login/logout, expiry, private endpoints, cross-account backup isolation, malformed/oversized backups, publishing authorization and validation, throttle behavior, headers and bundled curriculum compatibility. See `docs/VERIFICATION.md` for the actual result and limits.

## Deployment and scope

See `DEPLOYMENT.md` for exact origins, setup and verification. A local test pass does not establish a successful hosted deployment. The API uses a process-local authentication limiter; stay on a single worker or introduce shared limiting before scaling. Versioned migrations, account recovery and broader deployment hardening are separate work. No new frontend behavior, model prediction or production certification is claimed by this update.
