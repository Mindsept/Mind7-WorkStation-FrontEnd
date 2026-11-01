# MindSept WorkStation frontend

React, TypeScript and Vite client for the private MindSept team workspace. The application provides projects, a shared documentation hub, resource and folder management, Markdown editing, HTML presentations, PDF viewing, bookmarks, context export, profile photos and Croissantage attendance.

## Requirements and local setup

Use Node.js 24 LTS and npm. The supported Node range is 22.12 through 26. A running WorkStation backend with Microsoft Entra authentication and local access grants is required. There is no demo mode or frontend identity selection.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:5173`. Vite forwards `/api` to the backend configured by `API_PROXY_TARGET` (default `http://127.0.0.1:8000`). Use one consistent browser hostname in the backend origin and callback configuration. Private `.env` files are ignored; commit only the sanitized `.env.example`.

| Setting              | Purpose                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| `API_PROXY_TARGET`   | Backend target used by the Vite development server only                |
| `VITE_MAX_UPLOAD_MB` | Client upload limit in MiB, default 20; match backend `MAX_FILE_BYTES` |

Values prefixed `VITE_` are public build-time configuration. Never put credentials, identity tokens, client secrets or tenant administration configuration in frontend variables. Microsoft credentials and access grants belong to the backend.

## Commands

| Command                | Purpose                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`          | Local development server with the API proxy                      |
| `npm run typecheck`    | TypeScript validation                                            |
| `npm run format:check` | Source and test formatting                                       |
| `npm run test:unit`    | Domain validation tests                                          |
| `npm run build`        | TypeScript checks and production output in `dist/`               |
| `npm run preview`      | Local inspection of the compiled output; not a production server |
| `npm test`             | Chromium tests against the compiled production application       |

Before running browser tests, run `npx playwright install chromium` and `npm run build`. Contract tests start Vite preview on port 4173 and intercept API requests with isolated test fixtures. They do not require Microsoft credentials or mutate a real backend. Test code and fixtures stay outside `src/` and are excluded from production output. Main-branch CI runs formatting, type checking, domain tests, build and production contract tests on pushes and pull requests targeting main.

## API integration

The typed API client is isolated in `src/api/`. All requests use same-origin `/api/v1` endpoints and cookie sessions with `credentials: include`. The normal Microsoft button navigates to `/api/v1/auth/login`. Backend owns the OIDC callback and session. `/auth/session` supplies the current user and an in-memory CSRF token; mutations send `X-CSRF-Token`. Logout posts to `/auth/logout`. No identity credentials are stored in browser storage.

Authorized users manage shared projects and documentation. Attendance actions require literal `session.user.can_manage_attendance === true`; missing or false capability never falls back to role. The member directory contains accounts that completed their first authorized sign-in. Counts are backend aggregations. Event dates remain calendar dates, and timestamps are displayed in Europe/Paris.

Resources and documentation share the same records. Context export downloads the backend ZIP without creating a frontend archive or sending content to an external LLM. HTML previews use an isolated iframe with scripts disabled by default; optional slide scripts never enable same-origin access. Markdown disables raw HTML and rejects unsafe link protocols. PDFs retain a download fallback. The backend contract governs content CSP, validation, permissions, upload limits and conflict responses.

## Production deployment

```sh
npm ci
npm run typecheck
npm run format:check
npm run test:unit
npm run build
npm test
```

Publish only `dist/` to your static web server. Do not publish repository source, tests, private environments, local screenshots, browser sessions or generated reports. The `deploy/nginx.conf.example` file shows SPA routing and a same-origin `/api/` reverse proxy; adapt its backend address, hostname, upload limit and TLS termination to the deployment. Configure backend Entra callback/origin URLs and secure session cookies for the public HTTPS origin. Vite's development proxy is not part of `dist/`.

The Nginx example disables access logging for `/api/` so inherited access logs cannot record Microsoft callback query parameters. Use backend structured logs that omit those parameters, and apply the same policy to any upstream proxy or load balancer.

Preserve backend content-security and cookie headers on API responses. Uploaded HTML must retain backend sandbox/CSP restrictions; do not relax them to allow external assets. Asset filenames are stable, so deployment must revalidate `/assets/` when replacing a release; avoid unconditional immutable caching. `index.html` should also be revalidated. Keep SPA fallback for application routes but never route `/api/` failures to `index.html`.

Production HTTPS, proxy settings, the deployed Microsoft callback and cookie behavior must be validated on the target host. Local builds and intercepted contract tests do not establish deployment readiness by themselves.

## Design and attribution

Dark Art Deco architecture, forest and charcoal surfaces, brass accents and restrained motion provide a consistent visual hierarchy. Fonts and artwork are local; dense documents remain readable and reduced-motion preferences are respected. Source assets and original logo preservation are documented in [visual assets](design/ASSETS.md). Component credits and licensing are retained in [component attribution](design/ACETERNITY.md) and `.premium-frontend/licences/`.

The deployable output includes `THIRD-PARTY-NOTICES.txt` with the React Bits notice, Aceternity attribution and bundled font licenses.
