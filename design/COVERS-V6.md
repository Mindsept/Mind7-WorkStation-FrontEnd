# Static project covers and control correction V6

## Cause and fix

The apparent oversized Record attendance button was an escaping decorative layer, not oversized type or intrinsic button layout. The legacy `.attendance-heading .button { position: static }` overrode ActionButton positioning. Its absolutely positioned surface then used the entire heading as its containing block: 1058×170px at a 1440px viewport, although the native button was 184×44px. At 390px the escaped surface was 356×235px while its button was156×42px.

The shared base `.action-button` remains positioned for Radix dialogs rendered outside the shell, and `.app-shell .button.action-button` wins over legacy heading rules inside the shell. This fixes both shell and portal-rendered controls without shrinking text or forcing full-width buttons. The surface now remains inside its own button at all three widths. Pending native hit targets, labels and focus remain fixed. Existing loading capsules remain useful; no cosmetic delay was added.

## Stable surfaces

Removed the pointer state, translation, image scaling and Motion wrappers from WobbleCard. The replacement `IllustratedCard` uses ordinary static DOM. Project cards have only a subtle border/shadow hover; images, text and hit targets do not translate or scale. Croissantage summary, filter and table panels are stable. The local folder fan and upload feedback remain functional. The approved login/Mac and V4 atmospheric backgrounds are frozen; all approved login file SHA-256 hashes are unchanged.

## Catalog and persistence

The single frontend mapping is `src/api/project-covers.ts`. Backend docs/OpenAPI were read after publication. `Project.cover_key` is a required enum response field; create and PATCH inputs still contain only title/description. No key, asset URL or random value is sent by the production client. Backend selection happens once and persists. List and detail/documentation header use the same mapping. Unknown/missing metadata falls back deterministically to the final UUID byte modulo8, matching the migration order; invalid IDs fall back to archive. It never uses random rendering, array position, browser storage or external image URLs.

Explicit mock creation selects once from one crypto-random byte modulo8 (uniform because256 is divisible by8), stores the key on the mock project and preserves it through edits/navigation. Demo fixtures use fixed documented covers; the entire mock workspace still resets on reload. Independent real creations may share a cover; uniqueness is not promised or tested.

| Key | Local asset | Native generation | Delivered image | Provenance |
| --- | --- | --- | --- | --- |
| archive | `public/assets/card-archive-v5.webp` |1536×1024|1200×800,145650bytes|Original generated V5 archive desk, reused |
| salon | `public/assets/card-team-v5.webp` |1536×1024|1200×800,120648bytes|Original generated V5 salon still life, reused |
| atelier | `public/assets/covers/atelier-v6.webp` |1536×1024|1200×800,160746bytes|New built-in imagegen composition |
| observatory | `public/assets/covers/observatory-v6.webp` |1536×1024|1200×800,199886bytes|New built-in imagegen composition |
| library | `public/assets/covers/library-v6.webp` |1536×1024|1200×800,195592bytes|New built-in imagegen composition |
| gallery | `public/assets/covers/gallery-v6.webp` |1536×1024|1200×800,128504bytes|New built-in imagegen composition |
| conservatory | `public/assets/covers/conservatory-v6.webp` |1536×1024|1200×800,234738bytes|New built-in imagegen composition |
| vault | `public/assets/covers/vault-v6.webp` |1536×1024|1200×800,179684bytes|New built-in imagegen composition |

Six new images were generated with the built-in imagegen tool, separately prompted, then resized without enlargement to1200×800 WebP quality90. Archive and salon retain their existing quality88 deliveries. Every generated scene and every optimized delivery was visually inspected, including the contact sheet. Subjects are distinct: drafting model, telescope/dome, spiral library, sculpture gallery, botanical pavilion and circular vault. The shared palette is dark forest/obsidian/walnut/brass/ivory. Text-safe areas are quiet and left-weighted. Exact new prompts, original source paths, native/delivery dimensions and bytes are in `COVER-GENERATION-V6.json`; prior archive/salon prompts remain in `INTERACTIONS-V5.md`. Runtime assets are all local under `public/assets/`; no runtime generation occurs.

## Actual verification

- Production build, TypeScript and formatting passed.
- **17 targeted production-contract Chromium tests passed**: covers/proportions/static hover plus the affected interaction/profile tests. Assertions include native/decoration containment at1440/768/390; keyboard open/Escape/focus return; reduced motion; stable card and image transforms; all8 local mappings and decoded images; reorder/detail consistency; unknown-key fallback; create/save/upload/profile pending footprint, focus, duplicate guards, errors and retries. Dense table/filters/summary remain stationary.
- **2 targeted mock workflow tests passed**: cover assignment retained across edit/filter/navigation, plus attendance filters/CRUD/permissions.
- `node scripts/verify-covers.mjs` passed against the actual migrated local backend. Two isolated projects were created through the UI, server keys verified in list/detail/reload/PATCH and exported project.json, with exact create/PATCH payload fields checked. Both projects and the temporary session were cleaned up. No existing project/avatar/session was modified. The test deliberately does not require random uniqueness.
- Personally inspected Croissantage in the live browser before/after and reviewed1440/768/390 captures, all eight optimized cover images and the complete catalog grid. Approved login hashes remain unchanged. No unrelated full regression suite was rerun.

## Evidence

- `artifacts/covers-v6/attendance-before-{1440,768,390}.png` and matching `attendance-after-*.png` are fresh viewport screenshots.
- `layout-before.json` / `layout-after.json` record exact native button, surface geometry and positioning.
- `project-catalog-desktop.png` shows all8 covers using explicitly labelled fixture records; `catalog-contact-sheet.png` shows the delivered image collection.
- `real-project-covers.png`, `live-verification.json` and context ZIPs record actual persisted backend acceptance.
- `build.log` and `tests.log` retain the successful build/17-test output. Earlier V5 evidence is historical and superseded for card motion.

## Handoff

Backend migration0004_project_covers is available and was verified locally. No new API input, environment variable, dependency or deployment change. No unresolved integration discrepancy. Existing live Entra/Graph, production HTTPS/proxy and non-Chromium/physical-device deployment checks remain external. All writes stayed in frontend/.
