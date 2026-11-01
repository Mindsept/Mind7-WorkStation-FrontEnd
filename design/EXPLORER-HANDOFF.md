# Documentation explorer and project bookmarks

Date: 2026-11-01. Frontend scope only. This extends the approved V4 interface without changing its centered navigation, backgrounds or sign-in composition.

## Delivered behavior

Resources and Documentation use the same `ResourceCollection` explorer and the same cached canonical resource records. Documentation opens on Files; Overview remains a separate editable area, backed by the existing documentation record rather than duplicate file bytes. The current folder is reflected in the URL, retained between Resources and Documentation, and restored after reload. The breadcrumb starts at **Project root**. Lists show immediate children, folders first; the search and item count explicitly apply to the current folder.

New folder, New file and Upload remain available at the root and in empty folders. New file creates UTF-8 Markdown through the normal multipart API, including blank Markdown. Existing Markdown can be edited from the explorer or reader with write/preview controls. The editor hashes the actual downloaded bytes with SHA-256 and freezes that version while editing. It sends that hash as `expected_sha256`. A concurrent edit preserves the draft and exposes an explicit latest-version comparison; loading the comparison updates the expected version without replacing the draft. There is no automatic overwrite retry.

Uploads accept multiple individual HTML/Markdown/PDF files, either from the file picker, a drop into the current folder or a drop onto a visible folder. The destination is shown before upload. Each file has its own transfer progress, processing state and success/error result. Invalid files do not prevent valid siblings from uploading; name conflicts never silently overwrite. OS directory import is explicitly unsupported. Browser file-drop navigation is prevented throughout the authenticated shell.

Files and folders support internal drag/drop moves and a keyboard/touch Move dialog. The dialog excludes a folder and its descendants from its own destinations; the backend remains authoritative for cycles, cross-project references, depth, name conflicts and concurrent changes. Rename separates the canonical filename from display title and preserves immutable upload provenance. Downloads use the canonical filename. Only empty folders can be deleted; nonempty refusals remain visible in the confirmation dialog. Existing HTML sandbox/CSP, PDF reader/download and Markdown sanitization behavior remain intact.

Important links appear near the project description, with add/edit/remove controls, label, URL and local inline SVG provider icons. The form previews the detected icon. Detection uses parsed exact hosts: `github.com`, `drive.google.com`, `docs.google.com`, otherwise generic Website. Persisted icons use the backend's provider field. Only absolute HTTP/HTTPS links without credentials or control characters are accepted; anchors use `target="_blank"` and `rel="noopener noreferrer"`. There are no remote favicons, metadata fetches, mailbox calls or API integrations. Provider SVGs are bundled in the React component and rendered on a light plate for branding contrast.

## Integrated API contract

Reconciled with `backend/docs/api-contract.md`, section **Documentation explorer and important links**, and the delivered OpenAPI schemas. No discrepancy or additional backend requirement remains.

| Operation | Contract used |
| --- | --- |
| Folders | Project `/folders` GET/POST and `/folders/{id}` PATCH/DELETE; `{name, parent_id}`; null means root, omission leaves parent unchanged |
| Resources | Existing paginated list still returns every project file; adds `filename` and `folder_id`; `original_filename` remains provenance |
| Rename/move | Resource PATCH `{title?, filename?, folder_id?}`; retain extension |
| Upload/create | Existing multipart endpoint with `file`, optional `title`, optional `folder_id`; blank Markdown allowed |
| Edit Markdown | Content PUT JSON `{content_markdown, expected_sha256}`; updated resource metadata returned; `409 content_conflict` preserves draft |
| Bookmarks | Project `/links` GET/POST and `/links/{id}` PATCH/DELETE; writable `{title,url}`, server-derived `provider` |
| Context export | Existing backend ZIP endpoint; nested and empty folders retained; manifest `logical_path` and `archive_path` authoritative; links in `project.json` |

The shared all-pages client loads every metadata page, including folders and links. The browser test explicitly verifies resources and folders beyond the first 100 records. Backend limits remain authoritative: folder depth 16, 1,000 folders, 100 links, 500,000 Markdown characters, existing per-file/project byte limits, and shared case-insensitive sibling name namespace. No frontend counters replace backend attendance aggregation.

Explicit development mocks implement the same endpoints and in-memory hierarchy/bookmark/edit flows. They reset on reload and never replace failed live requests. They still refuse ZIP export rather than constructing an imitation archive. The live backend owns full Unicode name validation, transactional locking, migration and export correctness.

## Actual verification

- `npm run typecheck`, `npm run build`, `npm run format:check`: passed.
- `npm test`: **18 Chromium tests passed**, comprising 7 mock workflows and 11 built-production contract tests. Existing auth, CSRF, permission, HTML isolation, Markdown, PDF and ZIP checks remain. Added nested explorer/drop/authoring/move/bookmark workflow, content-version conflict reconciliation, and metadata pagination beyond 100 records.
- `node scripts/verify-explorer.mjs`: passed against the actual local backend through port 5173, using explicit development identities. Tested nested folders, targeted multi-file drop, individual success/rejection, Markdown create/edit/blank content, actual concurrent conflict and preserved draft, filename/title/provenance, file dialog move, internal folder drag, reload persistence, namespace conflict and nonempty refusal, empty-folder/file deletion, bookmark CRUD/provider persistence, and mobile keyboard/folder/upload/move workflows.
- That live script downloaded a real ZIP containing four resources, four folders and three links. Every resource's exported bytes and SHA-256 matched its manifest entry. It verified nested logical paths, an explicit empty directory, canonical filename versus original filename, overview content and bookmarks in project metadata.
- Actual boundary checks: folder mutation without CSRF returned 403; a member could author project folders (201) while attendance mutation remained 403 and its UI control was absent. No browser runtime errors were observed. Acceptance projects and development sessions were cleaned up by their own recorded IDs.
- Axe WCAG 2 A/AA and 2.1 AA plus overflow checks passed on populated explorer pages at 1440, 768 and 390 pixels. Move dialog focus, Escape and restoration passed. A transient tab-switch color contrast issue was fixed by making the Files/Overview state change immediate.
- Approved login desktop/mobile screenshots remain pixel-identical to the pre-V4 baseline with reduced motion; approved component, stylesheet and assets retain their SHA-256 hashes. No image generation was needed for this feature addition.

The existing `scripts/verify-backend.mjs` selectors were adapted for the new Files/Overview and Upload UI, but that older broad attendance/PDF live script was not rerun for this feature. Its historical acceptance results remain separate. The new live explorer script and current production security tests are the checks actually run here.

## Preview and evidence

Real API: http://localhost:5173/projects. Demo: http://localhost:5174/projects/00000000-0000-4000-8000-000000000010/documentation. Demo mutations reset on reload.

Final clean viewport captures are under `artifacts/explorer/`:

- `viewport-links-1440.png`, `viewport-links-768.png`, `viewport-links-390.png`
- `viewport-files-1440.png`, `viewport-files-768.png`, `viewport-files-390.png`
- `viewport-move-1440.png`, `viewport-move-768.png`, `viewport-move-390.png`
- `viewport-checks.json`, `real-results.json`, `login-preservation.json`, `context-hierarchy.zip`

`node scripts/capture-explorer.mjs` recreates the clean screenshots with a temporary real-backend visual-review project and cleans it by ID. It verifies the sticky header at y=0 both at the page top and mid-scroll, with no overflow. Earlier `real-explorer-*.png` full-page captures were taken after scrolling and accessibility checks; their displaced sticky header and visible skip link were screenshot stitching/focus artifacts, not viewport behavior. Use the `viewport-*` captures for final review. Skip-link keyboard behavior remains intact.

No new frontend environment variables or production secrets are required. Deploy with the backend's additive migration/API version. Real Entra/Graph, production HTTPS, Firefox/Safari, physical devices and full screen-reader validation remain external acceptance items. Browser drag/drop is supplemented by picker and Move dialog actions for touch and keyboard access.
