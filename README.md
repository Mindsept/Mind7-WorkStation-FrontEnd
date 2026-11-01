# MindSept WorkStation frontend

React 19, TypeScript, Vite, React Router, TanStack Query and a local dark deco design system. All implementation and configuration in this directory are frontend-owned.

## Start locally

Use Node.js 22.12 or newer, below 27, and npm. The lockfile records the dependency versions used for verification.

```sh
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Open **http://localhost:5173**. The Vite server proxies `/api` to `http://127.0.0.1:8000`; configure `API_PROXY_TARGET` in `.env.local` if needed. Browser requests remain same-origin. Use `localhost` consistently in the browser and in backend origin/redirect configuration. Do not mix it with `127.0.0.1` for cookies.

The normal sign-in button always navigates to `/api/v1/auth/login`. Real Entra configuration belongs to the backend. When the backend's explicit development identity stub is enabled, choose an identity by opening one of these URLs through the frontend proxy:

- http://localhost:5173/api/v1/auth/login?dev_user=admin
- http://localhost:5173/api/v1/auth/login?dev_user=member

The backend deliberately does not select a stub identity when `dev_user` is omitted. Its redirect must point to `http://localhost:5173/`. Start the backend using its own README; this frontend does not provision or modify it.

## Development without a backend

```sh
npm run dev:mock
```

This explicitly enables the development-only adapter in `src/mocks/adapter.ts`. A visible demo banner provides member, signed-out, access-denied and session-expired states. Member sessions explicitly grant attendance management. All sample members represent previously authorized sign-ins, including members with zero events. Mutations and uploaded files live in memory and reset on page reload. Nothing is stored in browser storage.

Mocks require both `import.meta.env.DEV` and `VITE_MOCK_API=true`. Production output excludes the adapter and fixtures. Failed real requests never switch to mock data. Context export deliberately returns an explanatory error in mock mode; the frontend never manufactures a ZIP.

If `.env.local` explicitly sets `VITE_MOCK_API=false`, Vite's mode-specific `.env.mock` enables it for `dev:mock`; a shell-level environment variable takes precedence over both. Check the visible banner to confirm the active mode.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Real API development on port 5173 |
| `npm run dev:mock` | Explicit in-memory development workspace |
| `npm run typecheck` | Strict TypeScript validation |
| `npm run build` | TypeScript check and optimized production bundle |
| `npm run preview` | Inspect `dist/`; not a production API reverse proxy |
| `npm test` | Chromium browser workflow, security and accessibility tests |
| `npm run test:backend` | Real local backend acceptance, using its development identities |
| `npm run format:check` | Source formatting check |
| `npm run test:explorer` | Real local-backend explorer, bookmarks, conflict, ZIP and responsive acceptance |

Before browser tests, run `npx playwright install chromium` if Chromium is not installed. Run `npm run build` before `npm test`: production-contract tests exercise the built output on port 4173. Tests start their own mock Vite server on 5174. The real backend script expects the real frontend on `localhost:5173` and backend dev auth on port 8000. It creates a temporary project and attendance event and deletes only their recorded IDs. The current script also checks the development member photo lifecycle only after asserting that no photo exists, removes its test photo, and revokes its own sessions. Use a disposable development database; the script uses a test event on 2099-12-30 and fails on an existing event for that member/date.

Test screenshots, traces and downloaded verification artifacts are ignored under `artifacts/`, `test-results/` and `playwright-report/`. The real integration script uses full Chromium so its native PDF reader is available.

## Implemented workflows

- Backend-managed Microsoft sign-in, session resolution, capability-aware attendance actions, logout, and distinct loading, signed-out, expired, denied and unavailable states.
- Searchable shared project collection; project creation, editing, details and explicitly confirmed deletion.
- One documentation hub per project, an editable Markdown overview with preview, and the exact same resource query and records as the project view.
- HTML, Markdown and PDF upload; format/empty/size validation, actual XHR transfer progress, server processing state, title editing, authenticated download and confirmed deletion.
- Isolated HTML slide preview with script opt-in and fullscreen; safe Markdown tables, links and code; a native PDF reader and an always-available original download.
- Authenticated backend ZIP context export with loading, success and failure feedback. No external LLM calls.
- Authorized members who have completed their first sign-in in Croissantage, backend aggregate counts, date filters, member history, zero-event states, and shared attendance CRUD controlled by `session.user.can_manage_attendance`.
- Self-service profile photos: validated JPEG/PNG/WebP selection, centered preview, save/replace/remove, authenticated cached display and initials fallback. Mock photos reset on reload; the real backend persists normalized WebP. See [profile handoff](design/PROFILE-HANDOFF.md).
- Always-visible responsive horizontal navigation, keyboard-accessible Radix dialogs and account menu, dialog focus restoration, visible focus and reduced-motion support.

## Documentation explorer and bookmarks

Documentation opens on Files, with the existing project overview available through **Overview**. Resources and Documentation share one folder/file collection. Create nested folders, write or edit Markdown, upload several HTML/Markdown/PDF files, rename or move items, and download current files. Folder paths remain in the URL and survive switching views. Search and counts cover only the current folder. The root breadcrumb is labeled **Project root**.

Drop individual OS files onto the current folder area or a visible folder, then review the destination and upload results. OS directory import is not supported. Internal drag/drop moves have an accessible **Move** dialog alternative. Only empty folders can be deleted; conflicts and server errors remain visible without silent overwrites. Markdown editing detects concurrent changes and preserves the local draft for comparison.

**Important links** stores project bookmarks with local GitHub, Google Drive or generic SVG icons. Only HTTP/HTTPS URLs are accepted; no favicon or metadata requests are sent. These links do not connect external accounts.

The frontend requires the backend explorer/links migration and additive contract published on 2026-11-01. No new frontend environment variables are required. Run `npm run test:explorer` with the real Vite proxy on 5173 and backend development identities enabled. The script creates isolated acceptance data, checks real hierarchy-preserving ZIP bytes/checksums and removes only its own records. Run `node scripts/capture-explorer.mjs` for clean populated viewport screenshots. See [explorer handoff](design/EXPLORER-HANDOFF.md) for exact schemas, limits, actual results and remaining external validation.

## API integration

`src/api/types.ts` matches the delivered backend OpenAPI schemas in `backend/docs/openapi.json` and `backend/docs/api-contract.md`. `src/api/client.ts` owns HTTP behavior and never exposes secrets to components.

- Fixed same-origin prefix: `/api/v1`.
- Fetch uses `credentials: 'include'`; multipart XHR uses `withCredentials=true`.
- The session CSRF token is kept in memory and sent as `X-CSRF-Token` on every mutation, including logout and uploads.
- A 401 invalidates the workspace and resolves a fresh session; access denial also clears cached data. Permission/CSRF failures remain actionable errors.
- Collections use `{ items, total, limit, offset }`. The adapter requests pages of 100 until complete, so members beyond the first page remain visible. Search filters the loaded project collection locally because the backend does not define a search parameter.
- Backend names are retained: `creator_id`, `resource_type`, `byte_size`, `uploader_id`, `directory_status`. Creator names are resolved from the member directory, with an ID fallback on details when unavailable.
- Attendance totals use `/attendance/summary`, never independent client counters. When changing a late event to absent, the client sends `minutes_late: null`. One event per member per date is enforced by the backend.
- Calendar dates remain `YYYY-MM-DD` strings. Displayed timestamps and the initial event date use Europe/Paris.
- The UI default upload limit is **20 MiB per file**, matching the backend. Set `VITE_MAX_UPLOAD_MB` to match a changed backend limit. The backend additionally enforces its project quota (currently 200 MiB) and export limit (220 MiB). Server validation is authoritative.

All pages currently load complete metadata collections. This is practical for the V1 internal team; large directories or resource libraries should move to server-backed paging/search in a future agreed contract. File content and ZIP downloads are buffered as bounded blobs in the browser; backend limits remain important on tablets.

## Uploaded content and hosting CSP

The content URL is fetched with the session, but its response headers do not follow bytes into `srcdoc`. The frontend inserts a trusted CSP **before all uploaded bytes**, then assigns the result only to an iframe. It never injects uploads into the portal DOM.

HTML sandbox is initially empty. The explicit “Enable slide navigation scripts” checkbox changes it to **`allow-scripts` only**. It never includes `allow-same-origin`, form, popup, download or navigation permissions. Script execution is opt-in on each viewer mount.

The child policy in `htmlPreview()` is:

```text
default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'
```

With script opt-in, only `script-src` changes to `'unsafe-inline'`. Inline JavaScript and inline event handlers can navigate slides; external scripts, eval, workers and network assets are unsupported. Blob-generated scripts/fonts are also intentionally unsupported in the frontend. The backend's direct-content response has its own sandbox/CSP, including broader blob-script/font allowance; that response policy remains necessary for direct endpoint access.

The **parent page's `frame-src blob:` restriction is also required**. It allows local PDF blobs and `srcdoc` but blocks a deck from navigating its own iframe to an HTTP URL, including a same-origin API URL. Do not widen this to `'self'`, `https:` or `*`. The iframe attribute by itself does not block self-navigation. Additional policies cannot relax the trusted child policy.

`index.html` includes the parent CSP. Its inline-script allowance is deliberate: `srcdoc` inherits the parent policy, and inline deck scripts would otherwise be blocked even after opt-in. The portal renders ordinary data through React and raw HTML is disabled in Markdown. The child never receives the parent's origin. Harden this architecture by moving active content to a separately isolated origin if future requirements demand additional capabilities; do not casually relax the current policies.

Markdown uses `react-markdown` and `remark-gfm`, with raw HTML disabled, a protocol allowlist (`https`, `http`, `mailto`, fragment links), safe external-link attributes, and non-fetching placeholders for images. This prevents Markdown image tracking. Relative Markdown links are not resolved to other resource records in V1.

PDF content is fetched with credentials and wrapped as an `application/pdf` blob. A browser-native iframe reader renders it when supported. The download button remains available regardless of viewer support. Object URLs are revoked on teardown; download URLs are revoked after the browser has started its download.

The policy follows the browser behaviors documented by [MDN for iframe sandboxing](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) and [CSP sandbox](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/sandbox). The tested frontend adds its own child policy because fetched bytes do not inherit response headers.

## Production deployment

Serve `dist/` and reverse-proxy `/api/` on the **same HTTPS origin**. Use SPA fallback to `index.html` for application routes. The backend owns OAuth callbacks, cookies, authorization, CSRF enforcement, file validation and direct-content response headers.

`deploy/nginx.conf.example` supplies the frontend static routing and parent security headers. Replace the hostname, TLS termination and backend upstream for your environment. It is an integration example, not a deployed server. Preserve the API's CSP headers; do not overwrite them with the portal policy. If additional CSP headers are applied by a gateway, test their intersection against both inline slide navigation and PDF rendering.

No identity tokens, client secrets or Entra configuration belong in `VITE_*` variables. Real tenant sign-in requires the backend's Entra setup and an explicit local access grant. The current contract has no Graph directory synchronization. Production serving, live Entra and non-Chromium browser validation remain deployment acceptance tasks.

## Art direction and assets

The authenticated interior uses two original dark Art Deco architectural edge compositions around a centered workspace. Graphite plaster, smoky walnut, aged brass and warm ivory establish physical depth; forest green separates team attendance. The compact horizontal header keeps Projects, Croissantage and the account menu visible on desktop and mobile. Project context persists while scrolling. Projects use illustrated cards and documentation uses a readable ivory paper surface.

The V4 portal assets, `portal-archive-v4.webp` and `portal-salon-v4.webp`, are native 1024×1536 images delivered without enlargement at WebP quality 94. Each renders at 512×768 CSS pixels for native detail at DPR2. They are positioned and cropped rather than stretched with viewport-wide cover scaling. They are not native 4K. See [Interior V4](design/INTERIOR-V4.md) for the pixelation diagnosis, generation prompts, density strategy and verification. The approved login is unchanged; desktop/mobile before-and-after captures are pixel-identical.

The sign-in scene combines two original generated images: `public/assets/studio-room-v3.webp` (126 KiB) and `public/assets/studio-mac-v3.webp` (66 KiB, real alpha). A separately aligned HTML screen uses coordinated room artwork, the brass logo and the live Microsoft action. On mobile the action moves below the complete device at normal readable size. There is no cinematic loading delay. Josefin Sans, Outfit and DM Sans are bundled locally.

React Bits `react-bits:glare-hover` TS-CSS is mounted on the computer screen for short material feedback on hover/focus, disabled for touch and reduced motion. The pinned revision and licence are preserved in `.premium-frontend/`. It adds no runtime dependencies. Dense task surfaces stay still.

The original supplied logo remains unchanged at `design/source/mind7-logo.png`; the user-requested brass adaptation remains in use. Exact generation prompts, asset sizes, reference analysis and component provenance are in `design/ASSETS.md`.

## Login preview and browser error integration

- Direct **signed-out demo**: `http://localhost:5174/?preview=signed-out` with `npm run dev:mock -- --port 5174`. The selector can switch authentication states; reload resets fixtures. This query is read only by the development mock adapter.
- Full demo portal: `http://localhost:5174/projects`.
- Real backend login gate: `http://localhost:5173/` when signed out. The Microsoft link remains `/api/v1/auth/login` and is never silently mapped to a development identity.
- Optional explicit local identity links: set `VITE_SHOW_DEV_SIGNIN=true` in development, or follow the backend's `development_identity_required` result. The links are labeled Development member/administrator; they are never shown in production.

The documented `auth_error` query hint is converted to static accessible text, removed from the URL, and focused on the sign-in heading. Unknown values show a generic error and are never reflected into text or markup. `/auth/session` remains authoritative; failed sign-in hints do not replace a valid session. There is no automatic login retry. Initial unauthenticated 401 means signed out. Logout 204/401 clears local state; 403/503 keeps the authenticated UI and reports failure.

Reproduce final visual evidence with `node scripts/capture-studio.mjs` (mock server on 5174). Reproduce the separate live backend development login/logout check with `node scripts/verify-login.mjs` (real Vite proxy on 5173). This checks explicit local identities, not real Microsoft Entra. Login acceptance screenshots/results are now saved under ignored `artifacts/final-acceptance/auth/`. See `HANDOFF.md` for the actual verification scope and remaining external dependencies.

The current authenticated interior evidence is under `artifacts/interior-v4/`. Run `node scripts/capture-interior.mjs` with the mock server on 5174 to capture desktop, tablet, mobile and DPR2 top/middle/bottom views. Login preservation comparisons require the pre-revision baseline PNGs and `approved-login-hashes.json` already stored in that local artifact directory; these ignored files are verification evidence, not shipped assets.

## Interaction revision V5

Project cards and the attendance summary now use two newly generated local archive/team illustrations. Pointer motion is limited to decorative planes; text, links, tables and document editors stay stable. Folder badges fan out on pointer or keyboard focus, while touch and reduced-motion behavior remain still. The shared upload surface supports multiple queued files, actual progress, partial failures and individual retry. Pending actions retain their labels, focus and dimensions and reject duplicate submissions. Context export expands into real request status with manual retry.

Four public Aceternity components were inspected and adapted; the paid Fluid Notch source was unavailable, so its export interaction is an original implementation. Sources, access boundaries, attribution and license are documented in [Aceternity provenance](design/ACETERNITY.md). Runtime motion uses `motion`. The approved login and V4 backgrounds are unchanged.

Final checks: build, TypeScript, formatting, **26 Chromium tests**, real-backend explorer acceptance and live profile-photo browser checks passed. Captures confirm centered layouts, no overflow and unchanged login pixels/hashes. See [V5 assets and verification](design/INTERACTIONS-V5.md) for prompts, evidence and remaining deployment checks.

Primary-action follow-up: authenticated create/save/upload/profile buttons share an original compact Fluid Notch-inspired morph. Only their decorative surface contracts around the loader; native hit targets, focus and accessible labels remain fixed. Secondary/table controls and approved login are unchanged. The affected 13 Chromium tests, build, TypeScript and formatting passed. Details and state captures are in `design/INTERACTIONS-V5.md` and `artifacts/fluid-buttons-v5/`.


## V6 correction: stable cards and persisted covers, 2026-11-01

Supersedes the V5 Wobble Card behavior. Pointer parallax/scale has been removed and static IllustratedCard now renders project and attendance art. The oversized Croissantage action was traced to a legacy `position: static` rule causing its decorative button surface to fill the whole heading; shared containing-block rules now cover both shell controls and portal-rendered dialogs. Native controls remain content-sized and40–44px high, with stable pending focus/footprint.

The eight-key cover catalog uses six NEW generated compositions plus the existing archive/salon originals. Production renders persisted backend `cover_key` in list/detail without sending new create/PATCH fields. Mock creation randomly selects once and stores it. Missing/unknown keys have a deterministic fallback. Migration0004 is available and actual UI creation/reload/edit/list/export acceptance passed for two isolated projects; cleanup completed. Build, TypeScript, formatting,17 affected production tests and2 targeted mock tests passed. No full unrelated suite was rerun. Approved login hashes remain unchanged. Full root-cause measurements, exact catalog/assets/prompts, screenshots and verification: [COVERS-V6.md](design/COVERS-V6.md).


## V6 center material and rounded surfaces, 2026-11-01

The authenticated backdrop now carries generated charcoal/forest mineral texture across the center, gutters and below-fold space, blended with the architectural edges. Shared 18/16px panel, 22/20px dialog, 9px control and 14px button tokens unify the workspace. Calm reading surfaces and static cards remain. The approved login/Mac scene is pixel-identical and all approved hashes are unchanged.

Build, TypeScript, formatting, three affected production geometry/keyboard tests and 18 targeted axe scans passed. Fresh desktop/tablet/mobile captures cover top/middle/bottom, overview and project/profile dialogs. No backend contract or dependency change; prior real cover acceptance was not repeated. See [material design and verification](design/MATERIAL-V6.md) for asset provenance, actual checks and external dependencies.


## Final acceptance before Entra integration — 2026-11-01

READY FOR AUTH: the two final UI fixes are complete. Export has a button-sized idle slot and contained pending/result/error content; Files/Overview have a consistent16px gap. The native export target remains stable, status never covers tabs, and approved login files are unchanged.

Fresh build/typecheck/format pass. Full Chromium suite:38/38 (8 development mock +30 production contract); after the final containment refinement,3/3 affected export tests with3 axe scans pass. Fresh live backend, explorer, two-project cover persistence and8-check local auth/session acceptance all pass. Final read-only cleanup confirms all5 owned project IDs404, no temporary attendance event and the development member avatar restored to initial null. Real Entra/OIDC/Graph and production HTTPS remain the next phase.

Current commands, exact results, evidence paths, known test boundaries and the capability matrix are in [Final acceptance](design/FINAL-ACCEPTANCE.md). This entry supersedes prior acceptance summaries for the current implementation.


## Local authorization and equal member rights — current contract

This supersedes older Graph/admin-only acceptance notes. The backend controls EPITA Microsoft sign-in and local PostgreSQL access grants. Members appear after their first authorized login. All authorized members can manage shared attendance; the frontend uses only `session.user.can_manage_attendance === true`, with no role fallback. Missing/false capability hides mutation controls. Legacy dev admin aliases remain backend-compatible, while the mock identity is a member with capability true. `directory_status` is not presented as Graph synchronization.

TypeScript, production build, formatting and all 41 Chromium tests pass. Targeted live development acceptance verifies member attendance CRUD and editing/deleting an event created by a different authorized identity; both owned events and sessions were cleaned up. Run `node scripts/verify-local-access.mjs` only against an explicitly enabled development runtime. It uses isolated dates 2099-12-27/28, requires those member/date slots to be empty, and performs no project/avatar mutation. Real Microsoft OIDC browser acceptance subsequently passed for the granted EPITA account; see the current acceptance entry below. See [current authorization handoff](design/LOCAL-ACCESS-HANDOFF.md).


## Real Microsoft sign-in acceptance — 2026-11-01

Actual EPITA Microsoft sign-in passed through the normal button in one visible Chrome tab, with personal consent completed by the user. The portal resolved Team member with attendance capability, displayed the first-login directory member with zero counts, retained the session on reload, and signed out successfully. Backend confirmed sessions1→0. Normal Microsoft SSO reconnection restored the same member ID and created_at with one new session and no duplicate member; business-data hashes stayed unchanged. The final session remains open for the user. No frontend implementation or design change was required.

This replaces the earlier pending real-OIDC status. It validates local HTTP Chrome with real Microsoft identity; production HTTPS/proxy/cookie deployment, other browsers/accounts and MFA remain outside the run. Only the explicitly granted EPITA account is currently authorized. Details and privacy-conscious evidence: [Real Microsoft acceptance](design/REAL-MICROSOFT-ACCEPTANCE.md).


## Repository checks and CI

This directory is the root of the standalone frontend repository. Use Node 24 and `npm ci` to reproduce the locked installation.

```sh
npm run test:unit
npm run build
npx playwright install chromium
npm test
```

The GitHub Actions workflow runs only unit tests and the production build (including TypeScript checking), on pushes to `main` and pull requests. It does not deploy, publish artifacts or use application secrets. Local browser acceptance remains available through `npm test`; live API acceptance scripts accept `E2E_BASE_URL`, for example `E2E_BASE_URL=http://localhost:5180 npm run test:backend`. Run these scripts against a dedicated development-auth backend and disposable database, never a production environment. The mock command sets its own explicit flag and works without any local `.env.mock` file.

Only `.env.example` is versioned. Environment files, credentials, keys, local databases, backups, browser authentication state, traces, downloads, screenshots, generated test reports, dependencies and build outputs are excluded. Never put secrets in `VITE_*` variables: those values are public in browser builds. Review `git diff --cached` before committing; ignore rules do not remove an already tracked secret.

Commit messages follow Conventional Commits, e.g. `feat(projects): add shared project resources`, `fix(auth): handle expired sessions`, or `chore(ci): run tests and build`.
