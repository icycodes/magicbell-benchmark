# Send MagicBell Broadcast with Go SDK

## Background
MagicBell is a real-time notification platform that allows sending notifications across multiple channels. You need to write a Go program that triggers a notification broadcast to a single user using the official MagicBell Go SDK (`github.com/magicbell/magicbell-go`).

## Requirements
- Initialize a Go project under `/home/user/myproject`.
- Write a Go program (`main.go`) that uses the MagicBell Go SDK's `ProjectClient` to send a broadcast.
- The broadcast must target a single recipient whose email address is constructed using the `GMAIL_USER_NAME` and `ZEALT_RUN_ID` environment variables in the format: `<GMAIL_USER_NAME>+<run-id>@gmail.com`.
- The broadcast title must be `Alert: System Event <run-id>` and the content must be `A system event has occurred in run <run-id>`.
- Run the Go program to execute the broadcast.
- Save the resulting broadcast ID and recipient email to a log file `/home/user/myproject/output.log`.

## Implementation Hints
- Read the `ZEALT_RUN_ID`, `GMAIL_USER_NAME`, and `MAGICBELL_PROJECT_TOKEN` from the environment variables.
- Initialize the MagicBell Go SDK `ProjectClient` with the project token. Refer to the Go SDK documentation for `github.com/magicbell/magicbell-go/pkg/project-client/client`.
- Use `sdk.Broadcasts.CreateBroadcast` to send the broadcast. You may need to use helper utilities like `util.ToPointer` to set pointer fields in the request structs.
- Ensure you run `go mod init myproject` and fetch the required dependencies using `go get github.com/magicbell/magicbell-go`.
- Write the resulting broadcast ID to `/home/user/myproject/output.log` in the format `Broadcast ID: <broadcast_id>` and the recipient email in the format `Recipient: <recipient_email>`.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the Go script is executed, the broadcast is triggered on MagicBell, and the log artifact exists.
- Log file: /home/user/myproject/output.log
- The Go program must use the official Go SDK (`github.com/magicbell/magicbell-go`).
- The recipient email must be `<GMAIL_USER_NAME>+<run-id>@gmail.com` where `<run-id>` is read from the `ZEALT_RUN_ID` environment variable.
- The broadcast title must contain the `<run-id>` to ensure isolation.
- The log file must contain the broadcast ID in the format: `Broadcast ID: <broadcast_id>` and the recipient email in the format: `Recipient: <recipient_email>`.

