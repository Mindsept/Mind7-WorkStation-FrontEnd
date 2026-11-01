# Frontend V1 handoff

Implemented exclusively in `frontend/`. No backend or repository-root configuration was modified. Response schemas were reconciled with `backend/docs/openapi.json`; no shared API endpoint or payload was silently changed. Integration requirements and test results were sent to the orchestrator.

## Delivered

Complete React/TypeScript/Vite application with shared project CRUD and search, Markdown documentation editing, one shared resource collection, upload progress and validation, resource rename/download/delete, isolated HTML slides with optional inline scripts and fullscreen, Markdown rendering, PDF preview/download, backend ZIP export, directory-backed Croissantage, filters/history and administrator attendance CRUD.

Cookie sessions, in-memory CSRF, all authentication states, permission-aware UI, responsive navigation, dialog focus management, reduced motion, query caching, typed API layer, explicit development-only mocks, local fonts, original generated artwork and preserved MindSept logo are included.

## Verification actually performed

| Check | Result and scope |
| --- | --- |
| `npm run typecheck` | Passed, strict TypeScript |
| `npm run format:check` | Passed |
| `npm run build` | Passed, production assets emitted; no mock adapter or fixture identities in output |
| `npm test` | 18 Chromium browser tests passed (current explorer feature) |
| Automated accessibility | Axe WCAG 2 A/AA and 2.1 AA checks passed on Projects and Croissantage at 390, 768 and 1440 px; no horizontal page overflow; dialog Escape and focus return verified |
| Mock workflows | Project CRUD, shared overview/resources, upload/rename/download/delete, empty search, invalid upload, explicit unsupported mock ZIP, auth states, attendance duplicate feedback and corrections, member restrictions |
| Built production app with API fixtures | Loading/401/403/503, cookie and CSRF transport, multipart upload, backend-response ZIP download, session-expiry cache clearing, Markdown safety, PDF blob/fallback |
| HTML isolation in built production app | Script-disabled default; opt-in working inline slide controls; opaque-origin parent DOM/cookie/storage denial; blocked external assets/fetch, nested frames, forms, worker/popup attempts, top navigation, self-navigation to external and API URLs, and API meta refresh; fullscreen |
| Real backend through Vite proxy | Backend development admin/member login, project create/delete, persisted overview after reload, HTML/Markdown/PDF uploads, common resource collection, actual ZIP response, working inline slides, rendered native PDF reader, attendance create/correct/delete/filter/aggregation, logout |
| Actual ZIP inspection | README, project metadata, overview, manifest and three original resources present. Manifest byte sizes and SHA-256 hashes matched every resource |
| Actual server permissions | Member UI had no attendance mutation controls; direct member POST with valid CSRF returned `403 admin_required` |
| Browser runtime | No page errors in the real-backend acceptance script |
| Visual inspection | Generated artwork, desktop/mobile project screens, tablet attendance, sign-in and native PDF reader inspected |

The local integration used explicit backend **development identities and directory fixtures**, not Microsoft Entra OIDC or Graph. The production tests used the built `dist/` app with deterministic intercepted API responses. These are separate checks. Acceptance records were cleaned up by their created IDs.

The real-backend script and its recorded outputs are in `scripts/verify-backend.mjs` and ignored `artifacts/`. Browser screenshots and reports are local verification evidence, not tracked product assets.

## Required external validation

1. Real single-tenant Entra registration, callback, app roles, whitelist group, Graph permissions/consent and live synchronization are owned by the backend/operations team and were not exercised here.
2. Serve the built app and `/api` on the same HTTPS origin. `deploy/nginx.conf.example` is provided but was not deployed. Verify actual proxy/TLS/security-header behavior and retain the parent `frame-src blob:` policy plus the trusted child CSP and sandbox. Preserve the backend content CSP on API responses.
3. Firefox, Safari, real tablets, screen readers and production performance profiling were not tested. Native PDF rendering varies; original download remains available. Automated accessibility checks are not a full accessibility audit.

## Integration details to retain

- Normal sign-in is exactly `/api/v1/auth/login`; backend dev mode requires an explicit `?dev_user=admin` or `?dev_user=member` URL, documented in README.
- Upload default is 20 MiB. Frontend env limit must track backend configuration; project/export limits remain backend-enforced.
- HTML content is fetched with credentials and wrapped in a trusted CSP-prefixed `srcdoc`. Response headers do not transfer into `srcdoc`. Parent inline scripts are permitted specifically for inherited inline deck behavior; child network access is denied and `allow-same-origin` is never granted.
- The frontend accepts inline navigation scripts after opt-in; blob-generated scripts/fonts and remote resources are unsupported. The backend direct-content policy permits a broader blob subset, documented separately.
- Markdown raw HTML and unsafe protocols are disabled. Images render as text placeholders; relative resource links are not resolved in V1.
- Lists page through all server metadata (100 records per request). Project search is local because no search query is defined by the backend.
- Attendance dates stay calendar strings, timestamps display in Europe/Paris, and correcting a timed late event to absent sends `minutes_late: null`.
- Native progress and confirmation dialogs remain. V3 mounts React Bits GlareHover only on the sign-in computer glass; provenance and licence are retained.

## Assets

Built-in imagegen produced the local optimized WebP assets under `public/assets/`. The current authenticated interior uses `portal-archive-v4.webp` (377,530 bytes) and `portal-salon-v4.webp` (388,334 bytes), each native 1024×1536. The approved login retains its V3 room/Mac composition and brass identity. Exact prompts and provenance are recorded in `design/ASSETS.md` and `design/INTERIOR-V4.md`. The supplied logo remains unchanged at `design/source/mind7-logo.png`. No source reference artwork is reused as portal imagery.

## Dark deco redesign

Completed the requested visual revision within `frontend/`: full-bleed atelier sign-in, visible architecture on Projects and project details, a distinct café composition for Croissantage, brass/ivory identity, geometric display lettering, an editorial project index, and a shared attendance statistics rail. Obsidian/charcoal and forest surfaces replace incidental purple. Local fonts and generated assets do not depend on remote image delivery.

Desktop, tablet and mobile screenshots were captured at 1440, 768 and 390 px and visually inspected. Mobile context export now places the action beneath its explanation; session-status headings use a quieter scale. Reproduce the evidence with `node scripts/capture-redesign.mjs`; captures are in `artifacts/redesign/`.

This revision changes presentation and visible copy only. Auth/session, CSRF, API payloads, role enforcement, resource isolation and shared collections retain their existing implementations. No new backend contract requirements or root/backend edits. Existing external validation requirements above still apply.

Post-redesign verification: `npm run typecheck`, `npm run build`, `npm run format:check`, and all 13 Chromium tests passed. Axe and no-overflow checks passed at 390/768/1440 px. Both local preview servers responded HTTP 200 after verification. The real-backend acceptance listed above was completed before the visual revision; it was not unnecessarily repeated for presentation-only changes.

## V3 spatial studio revision, 2026-11-01

Implemented full-page room continuity, clearer destination navigation, compact project hierarchy, walnut project records, ivory documentation and forest attendance. Removed marketing banners, secondary explanatory filler and redundant navigation levels. The login now has two independently generated assets (room and transparent Mac), a separately aligned HTML screen, and a real Microsoft link. Mobile retains the complete device and places the same action beneath it. New assets total 196,678 bytes. Previous logo source remains untouched.

The frontend implements the backend's new documented auth-error redirect contract. Static notices, query cleanup, focus, unknown-code rejection, valid-session precedence and logout failure behavior are covered by tests. No API endpoint, payload, whitelist or authentication scope was changed by the frontend.

Final checks: typecheck, formatting, production build and all 15 Chromium browser tests pass. Responsive axe checks now include Projects, Croissantage, documentation and login at 390/768/1440 px. Code blocks are keyboard-scrollable. HTML sandbox/network isolation, PDF, Markdown, upload, ZIP, role and CSRF regressions remain passing. The signed-out screen's keyboard action, frame bounds and reduced-motion behavior were checked; desktop/tablet/mobile and top/middle/bottom portal screenshots were visually inspected.

Separate live backend development browser check (`scripts/verify-login.mjs`): seven checks passed for signed-out gate, normal Microsoft link returning the safe local-development notice, URL cleanup/focus, explicit development administrator login, existing-session precedence, UI logout followed by session 401, and no page errors. The temporary session was revoked. These are real local-backend results, separate from intercepted production-contract fixtures and from the earlier full backend CRUD acceptance. Live Entra/Graph and production HTTPS remain unverified.

Final preview: http://localhost:5174/?preview=signed-out (direct login), http://localhost:5174/projects (demo portal), http://localhost:5173/ (real API; login when signed out). Final screenshots: `artifacts/studio-v3/login-desktop.png`, `login-mobile.png`, `projects-desktop-top.png`, `documentation-desktop-middle.png`, `croissantage-desktop-bottom.png`, and corresponding tablet/mobile views. Asset prompts and React Bits provenance are in `design/ASSETS.md`.

Final orientation refinement after orchestrator review: the existing sticky top bar now shows `Projects > actual project title > Resources/Documentation`, including a compact two-line mobile treatment and a real Projects link. It subscribes to the existing project cache without issuing another request. Mid-scroll desktop/mobile screenshots were recaptured and inspected. TypeScript/build and the three affected responsive/accessibility tests passed again, including explicit persistent-context assertions. No unrelated test or backend changes were needed.

## V4 authenticated interior, 2026-11-01

Replaced the empty sidebar with compact horizontal navigation, visible primary links on mobile, an account menu, and persistent project breadcrumbs. Content is centered in the actual viewport at a 1060px maximum with equal margins. Project records and task controls are grouped more tightly; documentation remains an ivory reading surface. The sticky header is opaque so scrolled text cannot bleed through it.

Generated two fresh architectural backgrounds with distinct V4 filenames. Each native 1024×1536 image is encoded without resizing at WebP quality 94 and rendered at 512×768 CSS pixels. This avoids the previous viewport-cover enlargement and retains native material detail at DPR2. A native-size detail crop was visually inspected. These assets are not advertised as 4K. Prompts, source locations, delivery sizes and the diagnosis are in `design/INTERIOR-V4.md`.

The approved sign-in component, studio stylesheet, room, Mac and identity assets have unchanged SHA-256 hashes. Reduced-motion desktop/mobile login screenshots are pixel-identical before and after. Authentication, API contracts, resource security and permission behavior were not changed. All writes remained inside `frontend/`.

Actual final checks: TypeScript, formatting, production build and all 15 Chromium regression tests passed. The updated navigation test verifies visible destinations, active state, keyboard navigation and centering. The capture script verified centered geometry and no horizontal overflow for Projects, resources, documentation and Croissantage at 1440×900, 768×1024, 390×900 and 1440×900 DPR2, with top/middle/bottom captures. Final screenshots were visually inspected; the orchestrator approved desktop Projects, mid-scroll documentation, mobile Croissantage and the native detail crop. No new live-backend checks were necessary for this presentation revision; the external validation requirements above remain.

Preview: http://localhost:5174/projects and http://localhost:5174/croissantage. Approved login preview remains http://localhost:5174/?preview=signed-out. Evidence: `artifacts/interior-v4/verification.json`, `projects-desktop-top.png`, `documentation-desktop-middle.png`, `croissantage-mobile-top.png`, and `background-retina-native-detail.png`. No new integration requirements or contract discrepancies.


## Documentation explorer and important links, 2026-11-01

Delivered the filesystem-like Documentation/Resources explorer, nested folder CRUD, folder-aware multiple uploads and drops, Markdown creation/editing with optimistic conflict protection, canonical filename/title editing, internal moves plus keyboard/touch Move dialog, safe empty-folder deletion, and project bookmarks with local provider SVGs. Existing V4 shell, backgrounds and approved login are preserved. The overview remains its own editable documentation record, and both views use one canonical file collection.

Integrated the backend-published folder, resource metadata/content and bookmark additions exactly. No unresolved contract discrepancy remains. Production requires the matching backend migration/API version; no new frontend environment configuration is needed.

Final checks passed: TypeScript, production build, formatting and **18 Chromium tests** (7 mock workflows, 11 built-production contract tests). Separate live-backend browser acceptance passed nested creation, targeted multi-file drop, editing/conflict reconciliation, moves/rename/reload, bookmark CRUD, namespace/nonempty-folder refusals, mobile/keyboard actions, CSRF/member boundaries, and real ZIP tree/empty-folder/links/checksum verification. All temporary acceptance records and sessions were cleaned by their own IDs. The approved login remains pixel-identical at desktop/mobile with unchanged approved source hashes.

Clean final viewport screenshots, including populated bookmarks, nested files and Move dialogs at desktop/tablet/mobile widths, are in `artifacts/explorer/viewport-*.png`. The header was verified at y=0 at the page top and mid-scroll. Earlier scrolled full-page screenshots show stitching artifacts; use the viewport captures for review. Detailed behavior, schemas, provenance, verification scope and artifact paths are in [the explorer handoff](design/EXPLORER-HANDOFF.md). Existing live Entra/Graph, production HTTPS and non-Chromium/device acceptance dependencies remain.


## Interaction and profile polish V5, 2026-11-01

Completed source-inspected Images Badge, Wobble Card, LoaderOne and File Upload adaptations, two original generated local card illustrations, and an original Fluid Notch-inspired backend export interaction. The protected Fluid Notch source was unavailable; no paid access or protected code was obtained. Pending actions reject duplicate requests, preserve focus/labels/footprint, and retain failed drafts. Upload queues append batches and retry only failed files. Profile photo save/replace/remove follows the published self-service API and refreshes session/member metadata. Approved login/Mac files and V4 shell remain unchanged.

Checks actually run: build, TypeScript, formatting, all **26 Chromium tests**, live-backend explorer/ZIP acceptance and browser-based real profile-photo persistence/removal verification. Final responsive captures cover desktop/tablet/mobile/DPR2, no overflow, approved login pixel equality and unchanged source hashes. Real-backend test records/sessions were cleaned up; existing avatar state was preserved. Motion evidence is saved under `artifacts/interactions-v5/videos/`.

No contract discrepancy remains. Production needs the published avatar migration/API and normal Entra/Graph and HTTPS/proxy configuration. Live tenant sign-in, non-Chromium/physical device acceptance and deployment remain external checks. No new frontend environment variables; `motion` added to the frontend lockfile. Source provenance/license: `design/ACETERNITY.md`; generation and final verification: `design/INTERACTIONS-V5.md`; profile details: `design/PROFILE-HANDOFF.md`.


## Primary-action scope completion, 2026-11-01

The original Fluid Notch-inspired language now also applies to authenticated primary `ActionButton` controls: create/save/upload/profile actions, plus primary project/attendance openers. A decorative brass surface morphs from the full rounded label surface into a centered 64×32 loading capsule. The native button, outline, accessible name and hit target remain fixed. Response completion returns the surface immediately to its ordinary state; existing form errors and success feedback remain authoritative. There is no fabricated success timer, extra confirmation click or form-covering expansion. Secondary, destructive, icon and table controls retain their proportionate treatment. The approved login is untouched.

This is an original compact adaptation in `action-button.tsx` and `interaction-motion.css`, not official paid Fluid Notch source. The public LoaderOne adaptation remains inside it. Reduced motion switches state without the spring. A reserved upload progress slot also prevents the dialog and its focused submit button shifting when transfer progress appears.

Affected verification only: production build, TypeScript, formatting and **13 Chromium interaction/profile tests passed**. Create, save, upload and profile workflows were exercised at 1440px with normal motion and 390px with reduced motion through idle, pending, error, retry and success. Assertions cover decorative surface dimensions, identical native button position/size while pending, focus/label preservation, duplicate prevention and no overflow. Screenshots were visually inspected. All approved login SHA-256 hashes remain unchanged; prior pixel-equality evidence remains applicable because no login files changed. No backend/API change or new dependency.

Evidence: `artifacts/fluid-buttons-v5/{create,save,upload,profile}-{1440,390}-{idle,pending,error,success}.png`, `verification.json` and successful motion recordings in `videos/`. The earlier full 26-test run remains the prior baseline; this follow-up intentionally ran only affected tests.


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


## Local authorization and equal member rights — current integration

Supersedes the historical Graph/admin-only attendance model. Croissantage mutations now depend on explicit `session.user.can_manage_attendance`, without role fallback. Mock sessions are member+true; directory copy reflects first authorized login. Backend owns local grants and enforcement. Approved login source/style/assets retain all five baseline hashes.

Build, TypeScript, formatting and all41 Chromium tests pass. Targeted real API/browser acceptance confirms member attendance CRUD plus editing/deleting another authorized identity's event. Both owned events removed; both test sessions revoked and confirmed401. No project/avatar mutations. Real Microsoft runtime acceptance is prepared and pending backend readiness plus personal sign-in; development identity tests are not OIDC evidence. Detailed contract, commands, evidence and next steps: [Local authorization handoff](design/LOCAL-ACCESS-HANDOFF.md).


## Real EPITA Microsoft end-to-end acceptance — 2026-11-01

PASS, superseding the prior pending real-auth status. Frontend piloted one real Chrome flow after backend disabled dev auth: normal Microsoft button, user consent, callback into authenticated portal, member role and explicit attendance capability, first-login directory/zero counts, reload, actual UI logout, and Microsoft SSO relogin. Backend independently correlated session counts1→0→1, retained member ID/created_at, unique member and unchanged business-data hashes. No additional frontend fix was needed; prior41-test/build/typecheck/format results remain the source baseline. No shared-data mutation during this real-auth run. Final real session left open for Hamza.

Evidence, division between browser observations and backend assertions, and remaining deployment/browser/MFA boundaries: [Real Microsoft acceptance](design/REAL-MICROSOFT-ACCEPTANCE.md).
