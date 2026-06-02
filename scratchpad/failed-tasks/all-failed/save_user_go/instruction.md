# Save a MagicBell User with the Go SDK

## Background
MagicBell is a real-time notification platform. Backend services typically upsert their application users into MagicBell so that those users can later receive broadcasts and workflow notifications. You will write a Go program that uses the official MagicBell Go SDK (`github.com/magicbell/magicbell-go`) `ProjectClient` to upsert (save) a user, then capture the resulting MagicBell user `id` to a log file.

## Requirements
- Initialize a Go module under `/home/user/myproject` and add the official MagicBell Go SDK as a dependency.
- Write `main.go` that constructs the `ProjectClient` using `clientconfig.NewConfig().SetAccessToken(...)` with the project token from the environment.
- Call `sdk.Users.SaveUser` with a `users.User` payload that sets `ExternalId`, `Email`, `FirstName`, and `LastName`.
- Run the program and persist the saved user's MagicBell `id` to a log file.

## Implementation Hints
- Read `MAGICBELL_EMAIL`, `MAGICBELL_PROJECT_TOKEN`, and `ZEALT_RUN_ID` from the environment.
- Build the recipient-style email by splitting `MAGICBELL_EMAIL` at `@` (local + domain) and using sub-addressing to form `<local>+save-user-go-${ZEALT_RUN_ID}@<domain>`.
- The `users.User` struct uses `*string` fields; use the SDK's `util.ToPointer` helper to wrap string literals.
- Initialize the module with `go mod init myproject` and pull the SDK with `go get github.com/magicbell/magicbell-go`.
- Inspect the returned `*SaveUserResponse` to read `Data.Id` (a `*string`).

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the Go program is executed against the real MagicBell API and the log artifact exists.
- Log file: /home/user/myproject/output.log
- The Go program must use the official MagicBell Go SDK (`github.com/magicbell/magicbell-go`).
- The saved user's `external_id` must be `user-${run-id}` where `run-id` is read from the `ZEALT_RUN_ID` environment variable.
- The saved user's `email` must be `<local>+save-user-go-${run-id}@<domain>` where `<local>` and `<domain>` come from splitting `MAGICBELL_EMAIL` at `@`.
- The log file must contain a line in the format: `User ID: <user_id>` where `<user_id>` is the MagicBell-assigned user id returned by `SaveUser`.

