# Manage User Notification Preferences using JS SDK

## Background
MagicBell includes built-in user notification preferences. Users can customize which delivery channels (such as `email` or `in_app`) are enabled for different categories of notifications (such as `billing` or custom categories). These preferences are scoped per user and can be retrieved and modified securely from the client-side/user context using a User JWT and the MagicBell User SDK.

In this task, you will write a Node.js program that generates a secure User JWT, initializes the MagicBell JS SDK `UserClient`, fetches the user's initial notification preferences, updates the preferences to disable the `email` channel for the `billing` category, and verifies the update.

## Requirements
- Create a Node.js project under `/home/user/myproject` with an entrypoint file (e.g., `index.js`).
- Read the current trial identifier `run-id` from the `ZEALT_RUN_ID` environment variable.
- Define the user email as `user-${ZEALT_RUN_ID}@example.com` and the external ID as `user_${ZEALT_RUN_ID}`.
- **Generate a User JWT**:
  - Programmatically sign a User JWT using the `HS256` algorithm.
  - The signing key must be the `MAGICBELL_SECRET_KEY` environment variable.
  - The JWT payload must include:
    - `user_email`: `user-${ZEALT_RUN_ID}@example.com`
    - `user_external_id`: `user_${ZEALT_RUN_ID}`
    - `api_key`: `MAGICBELL_API_KEY` (read from environment)
- **Initialize UserClient**:
  - Initialize the MagicBell JS SDK `UserClient` (imported from `magicbell-js/user-client`) using the generated User JWT.
- **Fetch and Update Notification Preferences**:
  - Use the `UserClient`'s `notificationPreferences` service to fetch the user's notification preferences.
  - Update the user's notification preferences to disable the `email` channel for the `billing` category.
  - Fetch the updated notification preferences again to verify that the `email` channel for the `billing` category is disabled (`enabled: false`).
- **Log Results**:
  - Log the following results to `/home/user/myproject/output.log`:
    - The generated User JWT in the format: `User JWT: <jwt>`
    - The updated billing email preference status in the format: `Billing Email Preference Updated: <status>` (where `<status>` is `false` if successfully disabled).

## Implementation Hints
- Use the standard `jsonwebtoken` npm package to sign the User JWT.
- Import `Client` from `magicbell-js/user-client` to interact with the user-scoped endpoints.
- Use `client.notificationPreferences.get()` and `client.notificationPreferences.update(...)` to manage preferences.
- Remember to initialize the Node.js project (`npm init -y`) and install the required dependencies (`npm install magicbell-js jsonwebtoken`).

## Acceptance Criteria
- Project path: `/home/user/myproject`
- Ensure the Node.js program is executed and the output log is generated.
- Log file: `/home/user/myproject/output.log`
- The log file must contain lines in the following format:
  ```
  User JWT: <jwt>
  Billing Email Preference Updated: false
  ```
  Where `<jwt>` is the actual HS256-signed User JWT.

