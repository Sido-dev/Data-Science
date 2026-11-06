# Deploying the v2 learning workspace

This guide follows the current username/password workspace API. It supersedes the email-only login and wildcard-CORS instructions. Hosting operations were not performed by this patch; complete and record the checks below on your actual deployment.

## Backend

Use the **whole repository** as the service root. The public `/api/v2/content` fallback reads `frontend/src/learning/curriculum.json`, so a backend-only copy without that file is insufficient.

- Install: `python -m pip install -r backend/requirements.txt`
- Start from repository root: `uvicorn backend.app.main:app --host 0.0.0.0 --port 10000 --workers 1`
- Alternatively, from `backend/`: `uvicorn app.main:app --host 0.0.0.0 --port 10000 --workers 1`
- Match the host's configured port. The existing `render.yaml` uses port 10000 and a single worker. Review its Python version against the tested environment in `docs/VERIFICATION.md` before deploying.

Set the following through the hosting environment; `.env.example` is documentation and is not automatically loaded:

- `DATABASE_URL`: a database you control. Prefer a persistent service appropriate to your host. If using SQLite, the database file must live on persistent storage and the app must remain on one instance. Do not ship the repository's generated database as a fresh production database.
- `ALLOWED_ORIGINS`: exact frontend origins such as `https://your-project.vercel.app`, comma-separated for additional explicitly approved origins. Include no path or trailing slash. A preview deployment has a different origin and must be explicitly approved if needed.
- `ADMIN_KEY`: a generated random value at least 32 characters. Example generator: `python -c "import secrets; print(secrets.token_urlsafe(32))"`. Keep the result private and out of client build settings.

The application creates its v2 tables with SQLAlchemy on startup. This is not a versioned migration system. Back up first and review any future schema change. The root endpoint establishes process availability; it does not query database readiness.

## Frontend

Use `frontend/` as the frontend project root.

- Install/build: `npm ci && npm run build`
- Publish directory: `dist`
- Set `VITE_API_URL` to the backend origin, for example `https://your-backend.example`, with **no** `/api/v2` suffix. The client adds that prefix.
- Set the backend `ALLOWED_ORIGINS` to the actual public frontend origin. CORS allows bearer-token headers, not arbitrary `*.vercel.app` origins; cookie credentials are disabled.
- Rebuild after changing Vite environment settings. The active application uses `src/learning/api.js`; changing legacy Axios/store files is not needed to set the current API origin.

Leave cloud backup unconfigured if deploying a browser-only learning demo. Browser progress and JSON export/import remain independent from cloud accounts. Keep a backup before clearing browser storage.

Use the current branch (`main` in the inspected source). This guide does not issue a commit, push or deployment automatically.

## Hosted verification register

Perform with a disposable test account and non-sensitive notes; do not test against another user's records. The following remain **not performed by this update**:

| Check | Expected behavior | Status / evidence to record |
|---|---|---|
| Backend root over HTTPS | 200 service JSON, version 2.0.0 | Pending hosted verification |
| GET `/api/v2/content` | Valid published/bundled curriculum | Pending hosted verification |
| Real frontend origin | Content fetch allowed; no CORS failure | Pending hosted verification |
| Unapproved origin | No matching Access-Control-Allow-Origin | Pending hosted verification |
| Register, logout and login | Username/password flow, no email-only login | Pending hosted verification |
| Cloud upload/preview/restore | Explicit actions reproduce the selected backup | Pending hosted verification |
| Separate account | Cannot view/overwrite first account's cloud backup | Pending hosted verification |
| Invalid content/admin key | 422/403 without replacing published content | Pending hosted verification |
| Restart/redeploy | Database and cloud backup persist according to host configuration | Pending hosted verification |
| Database backup/restore and rollback | Restore into a separate test database and verify retained data | Pending hosted verification |

Local API regression tests are recorded separately in `docs/VERIFICATION.md`. They do not mark the hosted checks complete and do not establish a PostgreSQL production deployment.

## Tracked generated files

The inspected repository tracks `backend/learning_tracker.db` and Python bytecode. Updated ignore rules prevent new additions, but do not remove already-tracked files. Back up any local database first. From the repository root, the commands in the ZIP's `REMOVE_GENERATED_FROM_GIT.md` remove only the known generated paths from the Git index while retaining the working files. Review and commit those removals with the documentation/tests. Never delete a live database to apply this update.

## Troubleshooting

- **Cloud unavailable:** check the backend, HTTPS and `VITE_API_URL`; browser progress remains local.
- **401:** sign in again; verify the Bearer token is sent. This API does not accept email-only authentication.
- **403 publishing:** check the backend's secret length and the submitted `X-Admin-Key`. Do not put the secret in frontend environment variables.
- **CORS:** compare the exact frontend scheme/hostname/port with `ALLOWED_ORIGINS`; restart the backend after changing it.
- **Content fallback fails:** retain the repository's frontend curriculum JSON in the backend service checkout.
- **Lost cloud backup after a restart:** inspect database URL and storage persistence, rather than creating a replacement empty database without investigation.
