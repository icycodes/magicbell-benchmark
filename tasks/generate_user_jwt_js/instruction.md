# Generate and Verify MagicBell User JWT

## Background
In MagicBell, client-side components (like the in-app notification inbox) require a User JWT to securely access a specific user's notification context. These JWTs are generated on your backend using your project's Secret Key and API Key, signed with the HMAC-HS256 algorithm, and then sent to the client.

## Requirements
- Create a Node.js project under `/home/user/myproject` and write an `index.js` script to generate a secure User JWT and verify it using the MagicBell JS SDK.
- The script must read `MAGICBELL_API_KEY`, `MAGICBELL_SECRET_KEY`, and `ZEALT_RUN_ID` from the environment.
- Generate a User JWT with the following payload:
  - `user_email`: `user-${ZEALT_RUN_ID}@gmail.com`
  - `user_external_id`: `ext-${ZEALT_RUN_ID}`
  - `api_key`: The value of `MAGICBELL_API_KEY`
- Sign the JWT using the `HS256` algorithm with the `MAGICBELL_SECRET_KEY` as the secret. Set the token expiration to `1h`.
- Initialize the MagicBell JS SDK `UserClient` (`magicbell-js/user-client`) using the newly generated User JWT.
- Use the `UserClient` to fetch notifications by calling `listNotifications` with a limit of 5.
- Save the generated JWT to `/home/user/myproject/user_jwt.txt`.
- Save the execution log to `/home/user/myproject/output.log`. The log file must contain:
  - The generated User JWT in the format: `User JWT: <token>`
  - The API success message in the format: `API Status: Success` if the listNotifications call succeeded without authorization errors.

## Implementation Hints
- Initialize a Node.js project and install `jsonwebtoken` and `magicbell-js`.
- Import `Client` from `'magicbell-js/user-client'` to initialize the user-level client.
- Make sure to handle potential async errors gracefully and log appropriate messages.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the real JWT generation and API verification action is executed and the artifacts exist.
- Log file: /home/user/myproject/output.log
- Token file: /home/user/myproject/user_jwt.txt
- The generated User JWT must be validly signed using the `HS256` algorithm and contain the correct payload fields scoped with `ZEALT_RUN_ID`.
- The log file must contain the generated JWT in the format: `User JWT: <token>`.
- The log file must contain `API Status: Success` indicating the MagicBell API successfully authenticated and processed the request.

