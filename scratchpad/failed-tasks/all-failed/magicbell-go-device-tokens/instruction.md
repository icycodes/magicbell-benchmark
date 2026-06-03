# Register Web Push Device Token with Go SDK

## Background
MagicBell allows users to receive notifications across multiple channels, including Web Push. To securely interact with the MagicBell API as a user, you need to generate a User JWT on the backend and then use it to authenticate the User SDK. In this task, you will write a Go script that generates a User JWT and registers a web push device token for a specific user.

## Requirements
- Write a Go script that reads `ZEALT_RUN_ID`, `MAGICBELL_EMAIL`, `MAGICBELL_API_KEY`, and `MAGICBELL_SECRET_KEY` from the environment.
- Generate a User JWT using the HMAC-HS256 algorithm with the `MAGICBELL_SECRET_KEY`.
- The JWT payload must include `user_email` set to `<MAGICBELL_EMAIL>+<ZEALT_RUN_ID>@gmail.com` and `user_external_id` set to `user_<ZEALT_RUN_ID>`.
- Use the generated User JWT to initialize the MagicBell Go SDK `user-client`.
- Register a web push device token named `web_push_token_<ZEALT_RUN_ID>` for the user.
- Save the success message to a log file.

## Implementation Hints
1. Use `github.com/golang-jwt/jwt/v5` to generate the User JWT signed with `MAGICBELL_SECRET_KEY`.
2. Include the `api_key` in the JWT payload along with `user_email` and `user_external_id`.
3. Initialize `github.com/magicbell/magicbell-go/pkg/user-client/client` using the generated JWT.
4. Call the appropriate method in the `channels` package to save the web push token.
5. Write the output to `/home/user/magicbell-go-device-tokens/output.log`.

## Acceptance Criteria
- Project path: `/home/user/magicbell-go-device-tokens`
- Ensure the real registration action is executed and the log artifact exists.
- Log file: `/home/user/magicbell-go-device-tokens/output.log`
- The log file must contain the text: `Successfully registered web push token: web_push_token_<ZEALT_RUN_ID>` (where `<ZEALT_RUN_ID>` is the actual run ID).
- The script must be executable via `go run main.go`.

