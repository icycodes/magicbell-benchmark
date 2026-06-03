# Generate a MagicBell User JWT

## Background
MagicBell uses User JWTs to secure client-side communication for specific users. These tokens must be generated on a backend server using the project's Secret Key and API Key.

## Requirements
- Write a Node.js script to generate a User JWT for MagicBell.
- The script must use HMAC-HS256 algorithm to sign the token.
- The token must be signed using the `MAGICBELL_SECRET_KEY` environment variable.
- The JWT payload must contain:
  - `user_email`: The value of the `MAGICBELL_EMAIL` environment variable, appended with `+${run-id}@gmail.com` (e.g., if `MAGICBELL_EMAIL` is `testuser`, the email should be `testuser+${run-id}@gmail.com`). Use the `ZEALT_RUN_ID` environment variable for `${run-id}`.
  - `user_external_id`: `user_${run-id}`
  - `api_key`: The value of the `MAGICBELL_API_KEY` environment variable.
- The token must have an expiration time (e.g., '1y' or 3600 seconds).

## Implementation Hints
- Read `MAGICBELL_API_KEY`, `MAGICBELL_SECRET_KEY`, `MAGICBELL_EMAIL`, and `ZEALT_RUN_ID` from the environment.
- You can use the `jsonwebtoken` package in Node.js to sign the token.
- Print the generated JWT to standard output.

## Acceptance Criteria
- Project path: /home/user/myproject
- Command: node generate_jwt.js
- The stdout should print the generated JWT in the format: `User JWT: <jwt_token>`

