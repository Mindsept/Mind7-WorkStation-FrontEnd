# Local authorization and equal member rights

Current authorization contract, superseding historical Graph and administrator-only attendance notes. No visual redesign was made in this phase.

## Implementation

- Typed `session.user.can_manage_attendance` drives attendance creation, editing and deletion. Only literal true enables controls; false/missing remains closed even for a legacy admin role. Open editors also respect capability changes.
- All mock sessions use member role and explicit capability true. Admin-only mock restrictions and role selection were removed. Zero-event fixtures represent members who have already signed in.
- Directory copy explains that members appear after first authorized sign-in. No Graph synchronization claim or read-only attendance badge remains.
- Cookie sessions, CSRF headers, backend event aggregates and calendar dates remain unchanged. Backend authorization remains authoritative.
- Existing broader live scripts were adjusted for the revised contract, but were not rerun in this phase. The new narrow script avoids unrelated project and avatar mutations.

## Contract and deployment

Matches the superseding section of `backend/docs/api-contract.md`: local `(tenant_id, object_id)` grants, real Microsoft role member, all authorized users with attendance capability true, directory created on first authorized login. No API path or mutation payload change. Legacy development admin aliases retain their role. `directory_status` retains its compatible shape but represents local checks, not Graph synchronization.

Migration0005 and runtime readiness were reported by the orchestrator before the targeted live test. Frontend did not modify the backend, migrations or root configuration. Older backends without the capability will hide attendance mutation actions, so deployment must include the updated session response.

## Checks actually run

- `npm run typecheck`: pass.
- `npm run build`: pass.
- `npm run format:check`: pass.
- `npm test`: 41/41 Chromium tests pass (8 mock, 33 production-contract).
- Targeted prior runs: five mock authentication/attendance/responsive tests and six production capability/attendance-geometry tests pass.
- New capability tests exercise member+true CRUD, legacy admin+false, and legacy admin+missing. The latter two cannot fall back to role. Positive test checks mutation methods and cookie/CSRF behavior.
- `node scripts/verify-local-access.mjs`: pass against real API via localhost:5173 in explicit development mode. Member role/capability verified; actual browser create/edit/delete, filtered history and persisted edits pass. A different authorized identity created a second event; member PATCH returned200 and DELETE204.
- Exactly two owned attendance events were removed. Both newly created development sessions were logged out and subsequently returned401. No project/avatar mutations.
- Five approved login source, stylesheet and asset hashes remain unchanged.

Evidence: `artifacts/local-access/` contains build/typecheck/format logs, full-tests.log, capability-tests.log, mock-tests.log, live-test.log, live-results.json, and member-attendance-real.png. These local verification files are ignored, not production assets.

## Real Microsoft acceptance prepared, not yet executed

Wait for backend to announce the real-auth runtime ready. Then use the visible browser and normal Continue with Microsoft link without a dev_user parameter. The user handles personal credentials, MFA or consent. Do not collect, print or persist secrets, identity tokens, cookies or CSRF tokens in evidence.

Verify return from the backend callback into the authenticated portal; read only safe session assertions (role member, explicit attendance capability, user identity consistent with the signed-in account); confirm the member appears in the directory and inspect first-login zero counts only if this is truly a new member. Reload and verify the session persists. Use normal Sign out, verify the portal resolves signed out, then relogin and verify the same member ID persists. Do not claim external provider logout: WorkStation logout revokes its own session.

No real Microsoft/OIDC success is claimed by the development tests. Runtime configuration, an approved local grant, personal Microsoft steps, production HTTPS, and non-Chromium/physical-device checks remain external dependencies.


## Subsequent real authentication result

The prepared real Microsoft acceptance above has now been executed and passed for Hamza's granted EPITA account. Browser observations and independently correlated backend lifecycle evidence are recorded in [Real Microsoft acceptance](REAL-MICROSOFT-ACCEPTANCE.md). This supersedes this document's earlier pending-runtime status; production deployment and untested browser/account/MFA scenarios remain external.
