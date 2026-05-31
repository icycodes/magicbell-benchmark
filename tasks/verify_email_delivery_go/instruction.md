# Verify Email Delivery with Go SDK

## Background
MagicBell allows sending multi-channel notifications. In this task, you will write a Go program that uses the MagicBell Go SDK to trigger a broadcast notification to a specific user's email address. The delivery channels are configured to send an actual email to that address.

## Requirements
- Create a Go project under `/home/user/myproject`.
- Write a Go program that reads the following environment variables:
  - `MAGICBELL_PROJECT_TOKEN`: The project-wide administrative token.
  - `GMAIL_USER_NAME`: The base Gmail username for the recipient email address.
  - `ZEALT_RUN_ID`: The unique ID for the current execution run.
- Construct the recipient's email address as `{GMAIL_USER_NAME}+{ZEALT_RUN_ID}@gmail.com`.
- Use the MagicBell Go SDK (`github.com/magicbell/magicbell-go`) to create a broadcast notification targeting this recipient.
- Set the broadcast's title to `Verification Run {ZEALT_RUN_ID}` and content to `This is a test notification for run {ZEALT_RUN_ID}.`.
- Save the resulting Broadcast ID to the log file `/home/user/myproject/output.log`.
- Run the Go program to trigger the broadcast.

## Implementation Hints
- Initialize a Go module and fetch the official MagicBell Go SDK: `go get github.com/magicbell/magicbell-go`.
- Use the ProjectClient to authenticate and call `Broadcasts.CreateBroadcast`.
- Construct the `broadcasts.CreateBroadcastRequest` with a recipient containing the target email address.
- Use the `util.ToPointer` helper from `github.com/magicbell/magicbell-go/pkg/project-client/util` to set pointer fields in the request.
- Print the created Broadcast ID to the log file in the exact format: `Broadcast ID: <broadcast_id>`.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the Go program is executed and the broadcast is successfully sent to the real MagicBell API.
- Log file: /home/user/myproject/output.log
- The log file must contain the resulting Broadcast ID in the format: `Broadcast ID: <broadcast_id>`.

