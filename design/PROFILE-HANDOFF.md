# Profile photos

The account menu opens **Profile & appearance** for the current authenticated user. Members and administrators use the same self-service endpoint. The approved sign-in scene, Microsoft login link and Entra session flow are unchanged.

## Contract and behavior

- `PUT /api/v1/me/avatar` sends multipart with exactly one `file`, the session cookie and `X-CSRF-Token`. No member identifier is submitted. `DELETE /api/v1/me/avatar` removes the current photo.
- The returned `avatar_url` / `avatar_version` update session and member caches immediately, then both queries revalidate. They are optional nullable metadata for compatibility with older backend responses.
- The shared `Avatar` accepts only the supplied same-origin `/api/v1/members/{UUID}/avatar` endpoint. It retrieves bytes with credentials, creates a local object URL, aborts stale requests and revokes object URLs. A 404 or image decoding failure shows initials without a retry loop. It does not request Microsoft Graph photos.
- Selection checks the 5 MiB limit, supported extension, image signature, header dimensions and PNG/WebP animation flags before browser decoding. The frontend rejects dimensions over 8,192 or 16 million pixels. The backend remains authoritative for complete format validation and normalization.
- The draft previews the center square on white. Copy explains the server's 512-pixel maximum, center crop and white compositing of transparency. The original file is submitted; the backend performs EXIF orientation, normalization and metadata removal.
- Failed upload keeps the previous saved photo and selected draft. Save/remove each have actual pending state, an in-button loader, synchronous duplicate-submit guards, retained accessible names and no automatic mutation retry. Unmounted dialogs ignore late UI results. Successful removal returns to initials.
- The compact photo upload uses the same File Upload visual primitive as resource uploads, with a separate endpoint, single-file selection and photo validation. All profile object URLs are revoked on replacement/discard/unmount.
- The explicit development mock normalizes a selected photo into an in-memory WebP and returns matching metadata. It resets on page reload, as the demo banner states. Persistence is tested against the real backend and production contract fixtures, not falsely simulated across mock reloads.

## Verification actually performed

`npm run typecheck`, production build and the three `tests/profile-contract.spec.ts` Chromium tests passed. Fixtures cover multipart shape, CSRF/cookies, duplicate Enter presses, pending button focus and footprint, retained saved/draft photo after a delayed 503, manual retry, reload persistence, removal, invalid/spoofed/oversized/animated inputs, missing-image fallback, keyboard focus restoration and reduced-motion axe/no-overflow checks at 1440, 768 and 390 pixels.

Separate CUA browser acceptance used the actual backend through `http://localhost:5173`, signed in as the local development member. An independent API precheck confirmed that member had no existing photo. Synthetic solid-color PNG fixtures were selected, previewed, saved, verified after reload, replaced and verified in the Croissantage directory. A subsequent preview was discarded; the test photo was removed, and initials persisted after reload. The UI session was logged out. An independent cleanup check confirmed `avatar_url` and `avatar_version` were null and revoked its own inspection session. No preexisting user photo was modified.

Evidence under `artifacts/profile/`:

- `live-profile-preview.jpg`: real backend saved brass test photo and unsaved green square preview, with actions visible.
- `live-member-directory.jpg`: persisted photo displayed in the authenticated member directory.
- `live-profile-removed.jpg`: successful removal and initials fallback.
- `profile-busy.png`: a production fixture request deliberately held pending to inspect the real in-button loading state.

The colored squares are synthetic acceptance fixtures, not generated or fabricated personal photographs. Real Entra/Graph sign-in, production TLS and non-Chromium browsers remain outside these checks. The backend migration/API version supplying the published avatar contract is required.
