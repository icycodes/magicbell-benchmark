# Generate a MagicBell User JWT with Node.js

## Background
MagicBell's frontend SDKs (such as the React `FloatingInbox`) authenticate end users with a short-lived **User JWT** that must be minted on a trusted backend. The token is an `HS256`-signed JWT whose payload carries the user identity (`user_email` and/or `user_external_id`) and the project's public `api_key`, and it is signed with the project's `MAGICBELL_SECRET_KEY`.

In this task you will build a small Node.js script that runs on the backend, upserts a MagicBell user, signs a User JWT for that user, and writes the resulting token to a log file so that the rest of the platform can pick it up.

## Requirements
- Build a Node.js (ESM or CommonJS, your choice) script that runs end-to-end with a single `node` invocation.
- Read the run-id from the `ZEALT_RUN_ID` environment variable and use it to derive deterministic per-run identifiers.
- Upsert a MagicBell user on the project (`POST https://api.magicbell.com/v2/users` with the project token) so that the JWT later refers to a real user.
- Mint a User JWT for that user using HMAC `HS256` signed with `MAGICBELL_SECRET_KEY`.
- The JWT payload must include the fields `user_email`, `user_external_id`, and `api_key`, and the token must expire 1 year from issuance (`expiresIn: '1y'`).
- Write the minted token to a log file in the exact format `User JWT: <token>`.

## Implementation Hints
- Initialize a Node.js project under `/home/user/myproject` and install `jsonwebtoken` for the signing step. You may use `node-fetch`/`undici`/built-in `fetch` (Node >=18 ships with global `fetch`) for the REST call.
- Read `MAGICBELL_EMAIL`, `MAGICBELL_PROJECT_TOKEN`, `MAGICBELL_API_KEY`, `MAGICBELL_SECRET_KEY`, and `ZEALT_RUN_ID` from environment variables. Never hardcode them.
- Construct the per-run email by splitting `MAGICBELL_EMAIL` at `@` and inserting `+jwt-node-${ZEALT_RUN_ID}` as a sub-address (i.e. `<local>+jwt-node-${ZEALT_RUN_ID}@<domain>`). Use `user-jwt-node-${ZEALT_RUN_ID}` for the user's `external_id`.
- For the upsert, send a `POST` to `https://api.magicbell.com/v2/users` with `Authorization: Bearer ${MAGICBELL_PROJECT_TOKEN}` and a JSON body containing the per-run `external_id` and `email`.
- For signing, use `jwt.sign(payload, MAGICBELL_SECRET_KEY, { algorithm: 'HS256', expiresIn: '1y' })`.
- Append (or overwrite) the line `User JWT: <token>` to `/home/user/myproject/output.log` after the JWT is generated.

## Acceptance Criteria
- Project path: `/home/user/myproject`
- Ensure the script is actually executed against the real MagicBell API and the log artifact exists.
- Log file: `/home/user/myproject/output.log`
- The log file must contain a line in the exact format `User JWT: <token>` where `<token>` is the minted JWT.
- `<token>` must be a valid HS256 JWT signed with `MAGICBELL_SECRET_KEY` whose payload contains:
  - `user_email` equal to the per-run sub-addressed email derived from `MAGICBELL_EMAIL` and `ZEALT_RUN_ID`.
  - `user_external_id` equal to `user-jwt-node-${ZEALT_RUN_ID}`.
  - `api_key` equal to `MAGICBELL_API_KEY`.
  - an `exp` claim that is still in the future when verification runs.
- The JWT must be usable to call MagicBell's user-authenticated REST API (a `GET https://api.magicbell.com/v2/notifications` with `Authorization: Bearer <token>` must return HTTP 200).

