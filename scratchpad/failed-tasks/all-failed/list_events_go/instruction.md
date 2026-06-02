# List MagicBell Events with Go SDK

## Background
MagicBell is a real-time notification platform that records every notification activity (broadcast created, notification delivered, channel sent, etc.) as an event on the project's event log. You need to write a Go program that first creates a distinguishable broadcast, then uses the MagicBell Go SDK ProjectClient `Events.ListEvents` to fetch recent events and identify the event that corresponds to the broadcast just created.

## Requirements
- Initialize a Go module under `/home/user/myproject` (e.g., `go mod init myproject`).
- Fetch the official Go SDK: `go get github.com/magicbell/magicbell-go`.
- Write a Go program (`main.go`) that uses the MagicBell Go SDK `ProjectClient` with `MAGICBELL_PROJECT_TOKEN` to:
  1. Create a broadcast titled `Events Demo Go - <run-id>` with content `Triggering a Go SDK events listing demo for run <run-id>` to a single recipient whose email is derived from `MAGICBELL_EMAIL` and `ZEALT_RUN_ID`.
  2. After the broadcast call returns, fetch recent events via `sdk.Events.ListEvents` with a limit of at least 50.
  3. Find an event whose payload references the broadcast title `Events Demo Go - <run-id>` and capture its event ID.
- Write the matching event ID to `/home/user/myproject/output.log` in the line format `Event ID: <event_id>`.

## Implementation Hints
- Read `ZEALT_RUN_ID`, `MAGICBELL_EMAIL`, and `MAGICBELL_PROJECT_TOKEN` from the environment.
- Construct the recipient email by splitting `MAGICBELL_EMAIL` on `@` and inserting `+list-events-go-<run-id>` between the local part and the domain.
- Initialize the SDK with `clientconfig.NewConfig()` + `config.SetAccessToken(...)` and `client.NewClient(config)`.
- Use `sdk.Broadcasts.CreateBroadcast` first, then `sdk.Events.ListEvents` with `events.ListEventsRequestParams{Limit: util.ToPointer(int64(50))}`. The MagicBell event log may take a few seconds to update, so poll briefly if no matching event is found on the first call.
- When scanning the events response, inspect each event's serialized payload/data for the broadcast title text to identify the right event.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the Go program is executed, a broadcast is actually created on MagicBell, and the events list is queried via the Go SDK.
- Log file: /home/user/myproject/output.log
- The Go program must use the official Go SDK (`github.com/magicbell/magicbell-go`) for both the broadcast creation and the events listing.
- The broadcast title must be `Events Demo Go - <run-id>` where `<run-id>` is read from the `ZEALT_RUN_ID` environment variable.
- The log file must contain a single line in the format: `Event ID: <event_id>` where `<event_id>` corresponds to a real MagicBell event tied to the broadcast.

