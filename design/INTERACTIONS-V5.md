# WorkStation interaction revision V5

This revision preserves the approved login/Mac scene and V4 architectural backgrounds. The new assets are close-up illustrations inside meaningful project and team cards. Dense work surfaces retain the existing centered shell, breadcrumbs, typography and static document/table layout.

## Generated assets

Built-in imagegen was used, without CLI/API fallback. Both generated outputs were visually inspected before integration: crisp forest/charcoal shadows, warm brass light, textured ivory paper, quiet left areas and subjects on the right. Neither is a real document preview or a photograph of a team member.

| Local delivery asset | Generated source | Delivery | Bytes |
| --- | --- | --- | --- |
| `public/assets/card-archive-v5.webp` | 1536×1024 PNG |1200×800 WebP, quality88 |145650 |
| `public/assets/card-team-v5.webp` |1536×1024 PNG |1200×800 WebP, quality88 |120648 |

Original generated source locations (delivery has been copied into the project; runtime does not depend on these):

- `/Users/hamza/.codex/generated_images/01a1937f-cc47-7931-a5f0-f3a5fbf7ca1b/exec-f4e78a0f-7e8f-4d0e-95a9-b0c442d0df77.png`
- `/Users/hamza/.codex/generated_images/01a1937f-cc47-7931-a5f0-f3a5fbf7ca1b/exec-ab1938d2-c5b6-46a0-8c55-7e43106d7a1e.png`

### Archive prompt

Use case: stylized-concept. Asset: original illustration INSIDE a premium internal team portal project card, landscape3:2. A monumental miniature Art Deco knowledge archive on a black walnut architect's desk: ivory folded plans, a few precise brass dividers, sculptural stepped book spines and an emerald green glass reading lamp. Cinematic elegant1990s hand-painted cel-animation background with crisp ink silhouettes, subtle fine paper grain, rich dimensional warm amber light against deep forest green and charcoal shadows. Composition: objects occupy right two thirds, left third nearly black forest negative space for real HTML title overlay, horizon low, dramatic close-up perspective. Carefully restrained, architectural geometry, luminous brass edges, tactile paper. NO people, NO computers, NO lettering, NO logo, NO purple, no blue neon, no existing reference composition copied. Wide landscape, high detail. Image must remain legible at600px wide.

### Team prompt

Use case: stylized-concept. Asset: original illustration inside a premium internal team portal team/attendance summary card, landscape3:2. Close-up still life in an Art Deco Paris workspace: three espresso cups and a neatly folded ivory attendance journal on a highly polished dark walnut round table, one warm golden croissant on a small cream plate. No people. The background is sculptural dark forest green velvet banquette curves and elegant brass verticals with amber highlights. Cinematic1990s hand-painted cel-animation background, precise clean ink silhouettes, tactile fine grain, dark and elegant. Composition: all important objects grouped in RIGHT TWO THIRDS with LEFT THIRD calm very dark forest negative space for real HTML data, low intimate perspective, no room-wide view. Charcoal, forest, ivory and restrained warm brass gold palette. No purple, no blue neon, no lettering, no logo, no baked-in interface. High detail, crisp at600px card width. Match the restrained archive desk illustration family.

## Integration

Profile-photo schema and normalization follow `backend/docs/api-contract.md`, section Self-service profile photos, published2026-11-01. Only the current member may upload/remove their own photo. Session/member metadata refresh after save; authenticated image requests fall back to initials after failure without a retry loop. Frontend preview is a centered square on white, reflecting the server's documented treatment of transparent pixels. The server remains authoritative for image validation and normalized WebP persistence.

Source provenance, public source access and Fluid Notch's original-implementation distinction are documented in `ACETERNITY.md`.

## Final verification, 2026-11-01

- `npm run build`, `npm run typecheck`, `npm run format:check` passed.
- `npm test`: **26 Chromium tests passed** (7 explicit mock workflows and 19 built-production contract tests). Existing authentication, CSRF, iframe network/navigation isolation, Markdown, PDF, ZIP, permissions, pagination and conflict checks remain green.
- Five added interaction tests cover delayed request loaders, synchronous duplicate guards, retained button footprint/focus, retry after export/create failure, appended upload batches, partial failures with per-file retry without reposting successes, bounded wobble/folder targets, keyboard entry, reduced motion, coarse touch and Axe accessibility. Three profile tests cover validation, multipart/CSRF, persistence, replacement/removal, stale-image fallback, draft preservation and responsive dialogs.
- `npm run test:explorer` passed against the real local backend: nested folders, multi-file drops, Markdown editing/conflicts, moves, bookmarks, persisted reload, exact ZIP paths/checksums, calendar/member authorization and responsive keyboard behavior. The test now waits for the creation dialog to close before inspecting a newly created blank file. Temporary project and sessions were cleaned up.
- Real-backend profile save, replace, reload, directory/history display, discard and remove were verified through the browser using the development member. Its previous avatar was independently confirmed absent; cleanup restored that state and revoked the temporary session. See `PROFILE-HANDOFF.md`.
- `node scripts/capture-interactions.mjs` passed: centered layouts, no overflow at 1440×900, 768×1024, 390×900 and DPR2, plus **pixel-identical approved login at desktop/mobile and unchanged SHA-256 hashes** for approved login files.
- Personally inspected the live official component demos and source panels, final desktop card motion, keyboard upload surface, mobile upload modal and final captured layouts. Browser motion tests recorded successful videos under `artifacts/interactions-v5/videos/`.

Evidence: `artifacts/interactions-v5/verification.json`, `projects-desktop-top.png`, `croissantage-mobile-top.png`, `login-after-desktop.png`, and the videos directory. Additional live-profile captures are under `artifacts/profile/`; live-explorer checks and ZIP evidence are under `artifacts/explorer/`. Demo screenshots contain explicit sample data; fixture videos deliberately hold API requests to demonstrate pending/error states.

## Integration and remaining dependencies

No shared contract was silently changed. Self-service avatars require the published backend migration/API, now available and verified locally. `motion` is the only added runtime dependency. No new environment variables are required. The paid Fluid Notch source was unavailable, so the delivered export interaction is explicitly an original adaptation of the observed behavior. Aceternity provenance and license are recorded separately.

Live tenant Entra/Graph, production HTTPS/proxy deployment, non-Chromium browsers and physical device acceptance remain external deployment checks. No deployment was performed. All implementation changes remain inside `frontend/`.



## Primary-action scope completion, 2026-11-01

The original Fluid Notch-inspired language now also applies to authenticated primary `ActionButton` controls: create/save/upload/profile actions, plus primary project/attendance openers. A decorative brass surface morphs from the full rounded label surface into a centered 64×32 loading capsule. The native button, outline, accessible name and hit target remain fixed. Response completion returns the surface immediately to its ordinary state; existing form errors and success feedback remain authoritative. There is no fabricated success timer, extra confirmation click or form-covering expansion. Secondary, destructive, icon and table controls retain their proportionate treatment. The approved login is untouched.

This is an original compact adaptation in `action-button.tsx` and `interaction-motion.css`, not official paid Fluid Notch source. The public LoaderOne adaptation remains inside it. Reduced motion switches state without the spring. A reserved upload progress slot also prevents the dialog and its focused submit button shifting when transfer progress appears.

Affected verification only: production build, TypeScript, formatting and **13 Chromium interaction/profile tests passed**. Create, save, upload and profile workflows were exercised at 1440px with normal motion and 390px with reduced motion through idle, pending, error, retry and success. Assertions cover decorative surface dimensions, identical native button position/size while pending, focus/label preservation, duplicate prevention and no overflow. Screenshots were visually inspected. All approved login SHA-256 hashes remain unchanged; prior pixel-equality evidence remains applicable because no login files changed. No backend/API change or new dependency.

Evidence: `artifacts/fluid-buttons-v5/{create,save,upload,profile}-{1440,390}-{idle,pending,error,success}.png`, `verification.json` and successful motion recordings in `videos/`. The earlier full 26-test run remains the prior baseline; this follow-up intentionally ran only affected tests.
