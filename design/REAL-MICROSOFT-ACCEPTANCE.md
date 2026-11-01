# Real Microsoft browser acceptance

Date: 2026-11-01, Europe/Paris. This is actual Microsoft Entra authentication, distinct from the preceding development-identity acceptance. Frontend was the sole browser driver, using one visible Chrome tab and the normal Continue with Microsoft link at localhost:5173. No dev_user parameter was used. The existing approved login design was unchanged.

## Runtime prerequisite reported by backend

DEV_AUTH_ENABLED=false; API8000 and frontend proxy5173 ready200; anonymous session401; development identity links422; one enabled local EPITA access grant. Backend retained ownership of environment configuration, grant provisioning and database inspection. Frontend did not read the secret or modify backend/root files.

## Browser observations

1. Normal Microsoft button opened the Microsoft consent screen for MindSept WorkStation. The user personally accepted the displayed permissions; frontend did not approve consent on their behalf.
2. Microsoft returned to the authenticated projects page. Account menu displayed Hamza Hannat and Team member.
3. Croissantage displayed Record attendance, which is rendered only when `session.user.can_manage_attendance === true`. The unfiltered directory contained one member and zero late/absence events.
4. Reload preserved the authenticated member, attendance action and directory/counts.
5. Actual account-menu Sign out returned to the approved signed-out scene. Frontend paused before relogin for backend inspection.
6. After backend acknowledgment, the normal Microsoft link in the same tab returned directly through SSO to authenticated WorkStation. Directory still contained one member, zero events and the attendance action.
7. The final authenticated browser tab was left open for the user. No project, resource, avatar or attendance record was mutated during real-auth acceptance.

## Server checkpoints reported by backend

First login: one active EPITA member matching the enabled grant and one unexpired role=member session; zero attendance events and all15 prior audit records retained.

After UI logout: session count fell from1 to0; original member remained active and unique. Anonymous session requests through8000 and5173 returned401. These were separate HTTP clients, not extraction or replay of the browser's cookie.

After reconnection: backend confirmed the same member ID, created_at and tenant/object identity, exactly one active EPITA member and one unexpired member session. Session count progressed1 → 0 → 1 across login/logout/relogin. Audit, project, attendance and legacy-member hashes remained unchanged from the first-login checkpoint. No duplicate member was created.

The visible attendance action is evidence of the explicit capability through the frontend's strict boolean condition. Session JSON, browser cookies, CSRF tokens, identity tokens and callback parameters were not saved in verification artifacts. WorkStation logout was tested; Microsoft-wide account logout was not requested or tested.

## Evidence and boundaries

Local screenshots under `artifacts/real-microsoft/`: consent.png, authenticated-directory.png, signed-out.png and reconnected-directory.png. They show page content without address-bar callback parameters. Evidence contains the consenting user's work name/email and stays local.

No source change was necessary for this real browser flow, so the preceding successful TypeScript/build/format and41-test suite were not repeated. This acceptance covers desktop Chrome, local HTTP development serving with real OIDC, one granted EPITA user and SSO reconnection. Production HTTPS/cookie/proxy deployment, other browsers, other accounts, denied-user real login and MFA were not exercised.
