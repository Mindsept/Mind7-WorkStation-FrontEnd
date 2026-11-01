# Aceternity source and interaction provenance

Inspected on 2026-11-01 in the live official website, including each preview and its Code or Manual panel. The user's explicit request for these components supersedes the premium frontend skill's default React Bits-only scope. The existing React Bits login integration is retained unchanged.

| Official source | Access and inspection | Local adaptation |
| --- | --- | --- |
| https://ui.aceternity.com/components/images-badge | Complete public Manual source read. Preview observed closed and expanded, with paper fan and folding folder front. | `src/components/images-badge.tsx`: original proportional folder construction, spring stiffness400/damping25 and stagger retained. Smaller fan fits within file rows; local MD/HTML/PDF/DIR type cards replace remote demonstration images. Empty folders have no cards. Parent folder button controls pointer/focus state. |
| https://ui.aceternity.com/components/wobble-card | Complete public Manual source read. Pointer movement observed translating the outer plane and counter-moving/scaling its contents. | `src/components/wobble-card.tsx`: pointer delta/20, opposing image translation and scale1.03 retained. Movement is bounded, stable link/content plane added, local generated art replaces demo screenshot and external noise. |
| https://ui.aceternity.com/components/loader | Complete public Manual source read. LoaderOne's three staggered bouncing dots observed. | `src/components/action-button.tsx`: LoaderOne sequence and one-second staggered timing retained, size/travel reduced to fit actual buttons. Reduced motion renders static dots. The original accessible label occupies the same space while visual contents crossfade to the loader. |
| https://ui.aceternity.com/components/file-upload | Complete public Manual source read. Alternating grid and paper translating20px/-20px observed. | `src/components/file-upload.tsx`: grid, two paper planes and300/20 spring retained. Native accessible input/drop replaces the original dropzone wiring. Upload queue and photo use the same surface, with distinct validation and endpoints. Original design credit: Natko Hasic, as credited on the official page. |
| https://ui.aceternity.com/interactions/fluid-notch | Public preview observed notch→action card→notch. Code panel displays an All-Access gate. No `ACETERNITY_PRO_TOKEN` was available in the process environment. No protected code retrieved and no purchase made. | `src/components/fluid-action.tsx` is an **original implementation**, not the official component. A real export starts immediately, the control expands into request status, and success/error remains until dismissed. The same button retries failures. No mock assistant, review queue or artificial delay. |

The four public components were retrieved by reading their actual rendered Manual source, then adapted to the existing React/Vite/CSS system. No shadcn installer or root configuration rewrite was run. A direct HTTP attempt to archive the public pages returned403; no alternative endpoint probing or access-control bypass followed. Browser-visible Manual source remained available. The site does not expose an immutable source revision in these panels; the inspection date above is the revision reference, not a claim of an upstream Git tag.

## Attribution and license

Original public component code: Aceternity UI, Aceternity Labs LLC, https://ui.aceternity.com/. The official footer and licence page identify copyright ©2026 Aceternity Labs LLC, all rights reserved. Source comments retain attribution and link to this record. Official licensing reference: https://ui.aceternity.com/licence (read2026-11-01). It permits modified end products; it restricts redistribution of source items as components, stock, marketplace products or templates. These adaptations are used inside WorkStation, not offered as a component library. This work does not assert an MIT license or access to any paid component. No publication or deployment was performed.

Runtime dependency added: `motion`, resolved version in `package-lock.json`. React remains unchanged. Tailwind-specific `cn`, `clsx`, `tailwind-merge`, Tabler icons and react-dropzone from the original examples were unnecessary: this project already uses scoped CSS, Lucide and typed native file/drop handling. No Next.js dependency was added.

## Interaction intent and fallbacks

- Project cards and the attendance summary use imagery as a decorative moving plane. Text, actual counts, links and controls remain stable. Reading surfaces and tables are static. Coarse pointers and reduced motion do not wobble.
- Folder papers represent actual contained resource types, not document previews. Counts and labels are real; keyboard navigation and the Move dialog remain available. Coarse-pointer/reduced-motion folders stay legible and still.
- Pending buttons derive from actual operation state. Synchronous locks prevent duplicate submissions before React renders. Live upload percentages are XHR byte progress;100% means the browser sent the bytes and the UI shows processing until the server replies.
- Native upload input, focus indication, file validation, queued results and per-file retry remain explicit. Completed uploads are not resent by retrying another file.
- Context export's notch morph is tied to the backend ZIP request; no frontend archive fabrication or external LLM request occurs.
- Profile photos use the documented self-service API; no generated personal photos or Graph profile writes.

See `INTERACTIONS-V5.md` for assets and verification evidence. All local implementation files and dependency changes are inside `frontend/`.


## Primary-action scope completion, 2026-11-01

The original Fluid Notch-inspired language now also applies to authenticated primary `ActionButton` controls: create/save/upload/profile actions, plus primary project/attendance openers. A decorative brass surface morphs from the full rounded label surface into a centered 64×32 loading capsule. The native button, outline, accessible name and hit target remain fixed. Response completion returns the surface immediately to its ordinary state; existing form errors and success feedback remain authoritative. There is no fabricated success timer, extra confirmation click or form-covering expansion. Secondary, destructive, icon and table controls retain their proportionate treatment. The approved login is untouched.

This is an original compact adaptation in `action-button.tsx` and `interaction-motion.css`, not official paid Fluid Notch source. The public LoaderOne adaptation remains inside it. Reduced motion switches state without the spring. A reserved upload progress slot also prevents the dialog and its focused submit button shifting when transfer progress appears.

Affected verification only: production build, TypeScript, formatting and **13 Chromium interaction/profile tests passed**. Create, save, upload and profile workflows were exercised at 1440px with normal motion and 390px with reduced motion through idle, pending, error, retry and success. Assertions cover decorative surface dimensions, identical native button position/size while pending, focus/label preservation, duplicate prevention and no overflow. Screenshots were visually inspected. All approved login SHA-256 hashes remain unchanged; prior pixel-equality evidence remains applicable because no login files changed. No backend/API change or new dependency.

Evidence: `artifacts/fluid-buttons-v5/{create,save,upload,profile}-{1440,390}-{idle,pending,error,success}.png`, `verification.json` and successful motion recordings in `videos/`. The earlier full 26-test run remains the prior baseline; this follow-up intentionally ran only affected tests.


## V6 correction: stable cards and persisted covers, 2026-11-01

Supersedes the V5 Wobble Card behavior. Pointer parallax/scale has been removed and static IllustratedCard now renders project and attendance art. The oversized Croissantage action was traced to a legacy `position: static` rule causing its decorative button surface to fill the whole heading; shared containing-block rules now cover both shell controls and portal-rendered dialogs. Native controls remain content-sized and40–44px high, with stable pending focus/footprint.

The eight-key cover catalog uses six NEW generated compositions plus the existing archive/salon originals. Production renders persisted backend `cover_key` in list/detail without sending new create/PATCH fields. Mock creation randomly selects once and stores it. Missing/unknown keys have a deterministic fallback. Migration0004 is available and actual UI creation/reload/edit/list/export acceptance passed for two isolated projects; cleanup completed. Build, TypeScript, formatting,17 affected production tests and2 targeted mock tests passed. No full unrelated suite was rerun. Approved login hashes remain unchanged. Full root-cause measurements, exact catalog/assets/prompts, screenshots and verification: [COVERS-V6.md](COVERS-V6.md).


## V6 center material and rounded surfaces, 2026-11-01

The authenticated backdrop now carries generated charcoal/forest mineral texture across the center, gutters and below-fold space, blended with the architectural edges. Shared 18/16px panel, 22/20px dialog, 9px control and 14px button tokens unify the workspace. Calm reading surfaces and static cards remain. The approved login/Mac scene is pixel-identical and all approved hashes are unchanged.

Build, TypeScript, formatting, three affected production geometry/keyboard tests and 18 targeted axe scans passed. Fresh desktop/tablet/mobile captures cover top/middle/bottom, overview and project/profile dialogs. No backend contract or dependency change; prior real cover acceptance was not repeated. See [material design and verification](MATERIAL-V6.md) for asset provenance, actual checks and external dependencies.


## Final export containment

The original FluidAction adaptation now contributes a compact trigger and conditionally mounted status row to the export panel grid. No idle wrapper padding/border or empty status slot remains. Pending/result/error content stays inside the panel and cannot cover independent Files/Overview controls. The native action target/focus remains stable; only the actual status row expands. Final verification and the separate38-test full run plus3 affected final reruns are documented in [Final acceptance](FINAL-ACCEPTANCE.md).
