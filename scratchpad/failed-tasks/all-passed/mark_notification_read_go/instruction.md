# Mark a MagicBell Notification as Read with the Go SDK

## Background
MagicBell is a real-time, multi-channel notification platform. Frontend inboxes typically display unread notifications for each end user; backend or client code marks them as read once the user has acknowledged them. End-user notification operations are authenticated with a short-lived **User JWT** that is signed on the server using the project's **Secret Key** and **API Key** (HS256).

You will write a Go program that uses the official MagicBell Go SDK (`github.com/magicbell/magicbell-go`) to upsert a recipient user, broadcast a notification to that user, mint a User JWT, list the user's notifications, find the freshly created one, and mark it as read.

## Requirements
- Initialize a Go module under `/home/user/myproject` and add the official MagicBell Go SDK and `github.com/golang-jwt/jwt/v5` as dependencies.
- Write a Go program (e.g., `main.go`) that performs the following sequence against the real MagicBell API:
  1. Build a `ProjectClient` with the project token and upsert a user whose `external_id` is derived from `ZEALT_RUN_ID` (see Acceptance Criteria).
  2. Use the same `ProjectClient` to create a broadcast with a deterministic title (see Acceptance Criteria) addressed to that user.
  3. Mint a **User JWT** (HS256) signed with `MAGICBELL_SECRET_KEY`, whose payload contains `user_email`, `user_external_id`, and `api_key`. Do **not** use a hard-coded JWT.
  4. Build a `UserClient` configured with that JWT and list the user's notifications.
  5. Locate the notification whose title matches the one created in step 2 (polling for a short while if needed because of MagicBell delivery latency) and mark it as read via the Go SDK.
- Write the matched notification ID to a log file in the format described in Acceptance Criteria.

## Implementation Hints
- Read `ZEALT_RUN_ID`, `MAGICBELL_EMAIL`, `MAGICBELL_PROJECT_TOKEN`, `MAGICBELL_API_KEY`, and `MAGICBELL_SECRET_KEY` from the environment.
- Compute the recipient email by splitting `MAGICBELL_EMAIL` at `@` and using sub-addressing: `<local>+mark-read-go-${ZEALT_RUN_ID}@<domain>`.
- The Go SDK `ProjectClient` lives under `github.com/magicbell/magicbell-go/pkg/project-client/...` and the `UserClient` under `github.com/magicbell/magicbell-go/pkg/user-client/...`. Use `util.ToPointer` from the corresponding package to wrap string/int literals.
- The user-client mark-as-read method is `sdk.Notifications.MarkNotificationRead(ctx, notificationId)`.
- Use `github.com/golang-jwt/jwt/v5` with `jwt.SigningMethodHS256` and `MapClaims{"user_email": ..., "user_external_id": ..., "api_key": ...}` (an `exp` claim such as one year in the future is fine).
- Allow a few seconds of polling (e.g., retry `ListNotifications` for up to 60 seconds) before giving up on finding the broadcast — the broadcast pipeline is asynchronous.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the Go program is actually executed against the real MagicBell API; the user must exist, the broadcast must be created, and the notification must be marked as read on MagicBell.
- Log file: /home/user/myproject/output.log
- The Go program must use the official MagicBell Go SDK (`github.com/magicbell/magicbell-go`) for both the ProjectClient and the UserClient calls.
- The recipient user's `external_id` must be `user-mark-read-go-${run-id}` where `run-id` is read from the `ZEALT_RUN_ID` environment variable.
- The recipient user's `email` must be `<local>+mark-read-go-${run-id}@<domain>` where `<local>` and `<domain>` come from splitting `MAGICBELL_EMAIL` at `@`.
- The broadcast title must be exactly `Mark Read Go Demo - ${run-id}`.
- The User JWT must be generated programmatically in the Go program using HS256 with `MAGICBELL_SECRET_KEY` and a payload containing `user_email`, `user_external_id`, and `api_key`.
- The log file must contain a line in the format: `Notification ID: <notification_id>` where `<notification_id>` is the MagicBell-assigned id of the notification produced by the broadcast.
- After the program completes, the corresponding MagicBell notification must have a non-null `read_at` timestamp when fetched via the MagicBell REST API.

