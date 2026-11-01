# Final frontend acceptance — 2026-11-01

**READY FOR AUTH:** the current frontend and local development-backend integration have no known blocking issue. This means ready to start real Entra integration, not that Entra/OIDC/Graph or production deployment has been validated.

## Final UI changes

The export trigger has no extra idle wrapper border, padding or reserved status area. Its slot exactly matches the native button. Pending, success and error details occupy an additional row inside the export panel. On mobile the detail follows the button; it cannot cover Files/Overview or their actions. Only actual status content expands the panel. Button position, dimensions, focus, accessible name and duplicate-submit protection remain stable. Status uses live announcements and supports dismissal/retry. Reduced motion is respected.

Files/Overview have 16px of separation from either content panel at 1440, 768 and 390px. Existing rounded surfaces, assets, persisted cover catalog and approved login are preserved. No new dependency, environment setting or API contract change.

## Commands actually run

All commands run from `frontend/`. Logs and current acceptance receipts are in `artifacts/final-acceptance/` unless stated otherwise.

| Command | Actual result | Scope / evidence |
| --- | --- | --- |
| `npm run build` | Passed after final containment change | TypeScript project build and Vite production output; `build.log` |
| `npm run typecheck` | Passed after final containment change | `typecheck.log` |
| `npm run format:check` | Passed after final code and test changes | `format.log` |
| `npm run test` | **38/38 passed** | Complete Chromium suite: **8 explicit development mock workflows + 30 production-build contract tests**; `chromium.log` |
| `npx playwright test --project=production-contract tests/motion-contract.spec.ts --grep 'export notch'` | **3/3 passed** on final containment implementation | Final affected rerun after visual review: 1440/768/390, pending/error/success inside panel, no tab overlap, exact slot/button bounds, stable button/focus, duplicate guard, retry/download, 16px gaps, **3 pending-state axe scans**; `spacing-tests.log` |
| `npm run test:backend` | Passed | Actual backend development identities: base project/document/resource/attendance/auth journey, plus real profile lifecycle; `backend-verification.json`, `live-backend.log` |
| `npm run test:explorer` | Passed | Actual backend, **9 reported result groups**, including ZIP inspection and **3 responsive axe scans**; `explorer/real-results.json`, `live-explorer.log` |
| `node scripts/verify-covers.mjs` | Passed for **2 isolated projects** | Actual persisted server cover after creation/reload/edit/list/detail/ZIP; `covers/live-verification.json`, `live-covers.log` |
| `node scripts/verify-login.mjs` | **8/8 development-auth checks passed** | Real session revoke/expiry and logout; `auth/live-login-check.json`, `live-auth.log` |
| `node scripts/capture-material.mjs` | Passed | **18 targeted axe scans**, no horizontal overflow/centering errors, keyboard focus restoration, login desktop/mobile pixels identical and approved source hashes unchanged; `artifacts/material-v6/verification.json`, `preserved-login-layout.log` |
| Read-only acceptance cleanup verification | Passed | **5 owned project IDs return 404**, no temporary attendance event, member avatar restored to initial null, inspection session revoked; `cleanup.json` |

The complete 38-test run preceded the last visual containment correction. The final code was then built/typechecked/formatted and the three affected export tests plus their accessibility scans rerun. Unaffected live mutations were not repeated after that presentation-only correction. Login capture comparison preceded the last export-only change; no approved login file was modified at any point.

## Acceptance matrix

“Live” means the real API through `localhost:5173`, with explicit development identities and cookie/CSRF authentication. “Contract” means built production frontend on port 4173 with deterministic intercepted API fixtures. “Mock” means the deliberately enabled development adapter on 5174. These are separate evidence sources.

| Capability | Fresh evidence and outcome |
| --- | --- |
| Projects and covers | **Live:** create/read/edit/delete; two server-selected catalog keys persisted across reload, edit, list/detail and `project.json` ZIP export. Create/PATCH bodies contain only title/description. **Contract/mock:** all eight mappings, unknown-key fallback, reorder/search stability and once-selected mock cover. Randomness distribution is not statistically tested. |
| Important links | **Live:** GitHub, Drive and generic links created with correct local provider icons, persisted URLs and safe anchors; generic link edited/deleted/recreated. Export retained all three providers. Shared CRUD implementation covered by mock workflow. |
| Overview | **Live:** create/update Markdown, reload and ZIP content. **Mock/contract:** headings/tables/fenced code, raw HTML disabled, unsafe links and tracking images blocked. |
| Folders | **Live:** nested create/rename/internal drag/Move dialog, move to root and back, self/descendant destinations excluded, cyclic API move422, invalid path-name422, shared case-insensitive name conflict409, nonempty deletion rejection and empty deletion. |
| Uploads | **Live:** browser File/DataTransfer multi-file drop onto a specific folder, correct target path, dialog uploads, invalid-format result, actual409 filename collision and per-file Retry after conflict resolution. Successful sibling ID retained without re-upload. **Contract:** held request/progress, partial503/error/retry, appended files, synchronous duplicate guard and stable pending target at desktop/mobile. Native desktop file-manager drag was simulated with real browser File/DataTransfer objects, not physically performed. |
| Markdown files | **Live:** new and zero-byte blank Markdown, saved content edit, original filename retained after canonical rename, competing update conflict preserves local draft, latest-version comparison and reconciled save, move/download/delete. **Contract:** exact content-version race handling and pagination beyond first metadata page. |
| HTML slides | **Live:** authenticated upload/content, inline reader, empty sandbox until explicit script opt-in, `allow-scripts` only, navigation and fullscreen. **Contract:** parent DOM/cookie/storage isolation; blocked network/frames/forms/popups/top navigation/API self-navigation and meta-refresh. These adversarial fixtures are not claims about real tenant deployment CSP. |
| PDF and downloads | **Live:** PDF uploaded, authenticated blob reader and visible native Chromium PDF page inspected; PDF and Markdown original downloads checked. **Contract:** authenticated retrieval and persistent download fallback. |
| Context ZIP | **Live:** backend ZIP downloaded; explorer archive has **6 resources, 4 folders, 3 links**. Every manifest resource byte size and SHA-256 matches archived bytes. Nested logical paths, empty directory entry, canonical/original filename mapping and overview are checked. Separate cover archives verify exported persisted cover. No frontend-generated ZIP. |
| Croissantage | **Live:** whitelist member including directory-only person, late event/date filters/history, late-to-absent correction, delete/empty filtered history; member UI hides admin controls and API returns403. **Mock:** explicit zero-event members, date filtering and duplicate validation. Counts come from API aggregation. |
| Profile | **Live:** precheck confirmed no existing member photo; preview/save/reload/replace/remove/reload passed. Malformed direct API replacement returned415 and retained saved version/visible photo. Initial null restored. **Contract:** delayed503 UI failure retains selected draft and saved image, retry, duplicate guard, CSRF multipart shape, invalid formats/dimensions/animation and missing-image fallback. No pre-existing personal photo was overwritten. |
| Auth and CSRF | **Live:** signed-out gate, normal Microsoft link's safe dev-mode notice, explicit dev identity, consumed hint/focus, valid-session precedence, UI logout/session401, server revocation of own session followed by expiry UI. Missing-CSRF folder mutation403, member project mutation201 and attendance mutation403. **Contract:** loading/denied/service failure/logout failure/expired states and no silent mock fallback. |
| Interaction and accessibility | **Full suite + focused final rerun:** keyboard entry/Escape/focus restoration, pending loaders, draft retention, synchronous duplicate guards, reduced motion and coarse pointer behavior. **Live explorer:** keyboard folder entry, mobile upload/Move, 1440/768/390 no-overflow and axe checks. Final export detail is contained and never overlaps tabs in all three states. Automated axe is not a complete manual accessibility audit. |

## Visual evidence

Final focused viewport captures: `export-{1440,768,390}-{idle,pending,error}.png` and `overview-gap-{1440,768,390}.png`. Pending/error panels and tabs are fully visible. The screenshots and final containment were inspected by the frontend agent and orchestrator. `artifacts/pdf-real-backend.png` shows the real uploaded PDF rendered in Chromium. `live-avatar.png`, `explorer/live-retry.png` and responsive explorer captures show real API results. Fixture screenshots are clearly separate from live receipts.

## Corrections found during this pass

- Removed a legacy mobile 5px export-button margin, discovered by exact idle slot measurement.
- Moved initially overlaid status into the export section after screenshots exposed mobile tab obstruction; added explicit status-within-panel and no-overlap assertions.
- Updated existing acceptance selectors/synchronization for the current explorer. Folder metadata was previously read before rename completion; now the completed dialog/row is awaited.
- Corrected the auth script's assumption that a development shortcut remains visible after logout. The initial visible shortcut is tested; the separate expiry scenario explicitly navigates the development identity endpoint.
- Captured tab and overview geometry atomically to avoid mixing viewport coordinates across browser scroll anchoring. Assertions remain exact at16px; none were weakened to hide a UI defect.

The failed explorer run also deleted its own project. Final read-only verification covers that ID. All mutations were sequential and confined to recorded temporary projects/events and the initially empty development-member avatar. No global reset/truncation, API restart, backend file edit or root configuration change was made.

## External dependencies / next phase

No frontend integration blocker remains against the current local API/migration0004. The backend agent separately reported **120 passing tests on its isolated test database**, clean lint/format/migration checks and healthy live API; these are not counted as frontend-executed tests.

Real Microsoft Entra/OIDC tenant setup, redirect/secret/session behavior over production HTTPS, Graph whitelist synchronization, production deployment CSP/proxy behavior, Safari/Firefox and physical tablet/mobile/file-manager interactions remain unverified. Those are the next phase. The frontend continues to use backend-managed auth and never stores identity tokens or client secrets.


## Final repository acceptance — 2026-11-01

Before repository publication, a fresh isolated PostgreSQL run passed all 124 backend tests. Ruff checks and formatting passed, and Alembic detected no schema drift. The frontend passed 9 standalone unit tests (also run under Node 24), all 41 Chromium workflow/production-contract tests, formatting, and a production build under Node 24.

Four browser-to-API acceptance scripts passed against a separate Compose database/API and frontend proxy (ports 18081/5180): project/documentation/file/ZIP/avatar/attendance workflows, nested explorer and links including conflict/error handling, persisted cover selection, and equal member attendance permissions including modifying another member's event. Owned temporary projects/events were cleaned by the scripts. A separate fresh Compose build/migration/restart test verified persistent project, cover, session and avatar data. Neither stack loaded the real Microsoft environment file; the normal EPITA API and database were not restarted or modified. The preceding real Microsoft consent/login/logout/relogin acceptance remains documented separately.

Each standalone repository now has a tests-and-build-only GitHub Actions workflow. Frontend CI runs unit tests and TypeScript/Vite build; backend CI runs pytest with disposable PostgreSQL and builds the Docker image. Workflow syntax passed actionlint. No deployment or application secret is required. Generated browser evidence, private backups and local environments are excluded from Git.

Before the initial commit, Gitleaks scanned an export of each exact staged tree with zero findings. An additional in-memory comparison confirmed the configured Entra client secret is absent from every staged file. Representative environment/credential/key/backup paths were verified ignored, while `.env.example` remains included.


Final-loop correction: development server output exposed React cross-component render-update warnings from the breadcrumb's synchronous subscription to the entire query cache. The breadcrumb now uses the normal React Query observer for the selected project title. The project workflow and four live acceptance scripts now fail on this console error. After the fix, all 9 unit tests, all 41 browser tests, the production build and all four isolated browser/API scripts passed again with no such warnings. This preserves the approved sign-in assets and the real EPITA session.
