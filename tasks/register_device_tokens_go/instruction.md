# Register Device Tokens using Go SDK UserClient

## Background
MagicBell supports registering user-specific device tokens for channels such as Web Push and APNs. This allows targeted push notifications to be sent to specific devices. Token registration is a client-side action performed within the authenticated context of a single user using a secure User JWT.

In this task, you will write a Go program that programmatically generates a User JWT, registers a Web Push token and an APNs token for that user using the MagicBell Go SDK `user-client`, and then verifies the registrations using the MagicBell Go SDK `project-client` (administrative API).

## Requirements
- Create a Go project under `/home/user/myproject` with a Go program (e.g., `main.go`).
- Read the current trial identifier `run-id` from the `ZEALT_RUN_ID` environment variable.
- Define the user email as `user-${ZEALT_RUN_ID}@example.com`.
- **Generate a User JWT**:
  - Programmatically sign a User JWT using the `HS256` algorithm.
  - The signing key must be the `MAGICBELL_SECRET_KEY` environment variable.
  - The JWT payload must include:
    - `user_email`: `user-${ZEALT_RUN_ID}@example.com`
    - `api_key`: `MAGICBELL_API_KEY` (read from environment)
- **Initialize UserClient**:
  - Initialize the MagicBell Go SDK `user-client` using the generated User JWT.
- **Register Web Push Token**:
  - Call `SaveWebPushToken` on the `user-client` ChannelsService.
  - Set the `Endpoint` to `https://updates.push.services.mozilla.com/wpush/v2/gAAAAAB-${ZEALT_RUN_ID}`.
  - Set the keys `P256dh` to `p256dh-key-${ZEALT_RUN_ID}` and `Auth` to `auth-secret-${ZEALT_RUN_ID}`.
- **Register APNs Token**:
  - Call `SaveApnsToken` on the `user-client` ChannelsService.
  - Construct a 64-character APNs device token by starting with a string of 64 '1's (`1111111111111111111111111111111111111111111111111111111111111111`), and replacing the suffix with the `ZEALT_RUN_ID` (so that the total length is exactly 64 characters).
  - Set the `DeviceToken` to this constructed 64-character string.
- **Initialize ProjectClient & Verify**:
  - Initialize the MagicBell Go SDK `project-client` using the administrative `MAGICBELL_PROJECT_TOKEN` environment variable.
  - Retrieve/list the registered Web Push tokens for the user `user-${ZEALT_RUN_ID}@example.com` using the `project-client` ChannelsService's `ListUserWebPushTokens` method.
  - Retrieve/list the registered APNs tokens for the user `user-${ZEALT_RUN_ID}@example.com` using the `project-client` ChannelsService's `ListUserApnsTokens` method.
  - Verify that the registered Web Push token's endpoint and APNs token's device token match the registered values.
  - Print the registered Web Push Token ID and APNs Token ID to the log file `/home/user/myproject/output.log`.

## Implementation Hints
- Use the standard `github.com/golang-jwt/jwt/v5` or similar Go package to sign the User JWT.
- The MagicBell Go SDK packages are located under `github.com/magicbell/magicbell-go`.
- Import `github.com/magicbell/magicbell-go/pkg/user-client/client` and `github.com/magicbell/magicbell-go/pkg/user-client/clientconfig` for the `user-client`.
- Import `github.com/magicbell/magicbell-go/pkg/project-client/client` and `github.com/magicbell/magicbell-go/pkg/project-client/clientconfig` for the `project-client`.
- Use `util.ToPointer` from the respective packages to set optional pointer fields in the request models.
- Be sure to initialize Go modules (`go mod init myproject && go mod tidy`) and set up any required dependencies.

## Acceptance Criteria
- Project path: `/home/user/myproject`
- Ensure the Go program is executed and the output log is generated.
- Log file: `/home/user/myproject/output.log`
- The log file must contain lines in the following format:
  ```
  Web Push Token ID: <id>
  APNs Token ID: <id>
  ```
  Where `<id>` is the actual ID returned by the MagicBell API/SDK for each registered token.

