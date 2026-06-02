# Save a MagicBell Workflow Definition with the Go SDK

## Background
MagicBell Workflows let you define reusable, multi-step notification campaigns that can later be triggered with runtime input. You will write a small Go program that upserts a workflow definition using the official MagicBell Go SDK (`github.com/magicbell/magicbell-go`) via the `ProjectClient`.

## Requirements
- Initialize a Go project under `/home/user/myproject`.
- Write a Go program (`main.go`) that uses the MagicBell Go SDK's `ProjectClient` to upsert (save) a workflow definition through `Workflows.SaveWorkflow`.
- The workflow `key` must be `wf-save-go-${run-id}` where `<run-id>` is read from the `ZEALT_RUN_ID` environment variable.
- The workflow must contain exactly one step with `command` equal to `broadcast`. The step `input` must include:
  - `title`: `Workflow Save Go - <run-id>`
  - `content`: `Hello from Go saved workflow`
- After the SDK call succeeds, the program must write the saved workflow key to a log file `/home/user/myproject/output.log`.

## Implementation Hints
- Read `ZEALT_RUN_ID` and `MAGICBELL_PROJECT_TOKEN` from environment variables. Do not hardcode credentials.
- Initialize the SDK with `client.NewClient(clientconfig.NewConfig())` and call `config.SetAccessToken(...)` with the project token. The relevant packages live under `github.com/magicbell/magicbell-go/pkg/project-client/...` (see `client`, `clientconfig`, `workflows`, `util`).
- Use `util.ToPointer` to fill the pointer fields on `workflows.WorkflowDefinition` and `workflows.WorkflowDefinitionSteps`. The `Input` field is `map[string]interface{}`.
- Bootstrap the module with `go mod init myproject` and `go get github.com/magicbell/magicbell-go`, then run the program with `go run main.go`.
- Write the saved workflow key returned by the SDK to `/home/user/myproject/output.log` in the format `Workflow Key: <key>`.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the Go program is executed, the workflow is upserted on MagicBell, and the log artifact exists.
- Log file: /home/user/myproject/output.log
- The Go program must use the official Go SDK (`github.com/magicbell/magicbell-go`) and the `ProjectClient.Workflows.SaveWorkflow` method.
- The workflow key must be `wf-save-go-${run-id}` where `<run-id>` is read from the `ZEALT_RUN_ID` environment variable.
- The workflow must contain exactly one step with `command` equal to `broadcast`.
- The log file must contain the workflow key in the format: `Workflow Key: <key>`.

