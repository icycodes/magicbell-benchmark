# MagicBell Workflow Management in Go

## Background
MagicBell provides a powerful Go SDK to interact with its API. You need to build a CLI tool in Go that uses the ProjectClient to manage workflow definitions programmatically.

## Requirements
- Create a Go program (`main.go`) that acts as a CLI tool with a single positional argument for the action: `create`, `fetch`, or `delete`.
- The tool must use the `MAGICBELL_PROJECT_TOKEN` environment variable to authenticate the ProjectClient.
- The tool must read the `ZEALT_RUN_ID` environment variable to isolate resources. The workflow key must be `test-workflow-${run-id}`.
- **Action `create`**: Create (or save/upsert) a workflow definition with the key `test-workflow-${run-id}`. The workflow should contain at least one step (e.g., a `broadcast` command). The recipient email for this broadcast step must be the plus format of the `MAGICBELL_EMAIL` environment variable: `{MAGICBELL_EMAIL}+<receiver-id>@gmail.com` (use any receiver ID you like, e.g. test). Print exactly `Created workflow: test-workflow-${run-id}` to stdout on success.
- **Action `fetch`**: Fetch the workflow definition with the key `test-workflow-${run-id}`. Print exactly `Fetched workflow: test-workflow-${run-id}` to stdout on success.
- **Action `delete`**: Delete the workflow definition with the key `test-workflow-${run-id}`. Print exactly `Deleted workflow: test-workflow-${run-id}` to stdout on success.

## Implementation Hints
- Initialize the MagicBell Go SDK `ProjectClient` using `clientconfig.NewConfig()` and set the access token.
- Use the `workflows` package in the SDK to interact with workflow definitions.
- Handle errors appropriately and exit with a non-zero status code if an operation fails.
- The `ZEALT_RUN_ID` and `MAGICBELL_EMAIL` environment variables will be provided at runtime.

## Acceptance Criteria
- Project path: `/home/user/magicbell-go`
- Command: `go run main.go <action>`
- Action `create`:
  - The command input format is `go run main.go create`.
  - The stdout should print: `Created workflow: test-workflow-<run-id>`.
  - The workflow must be created in the MagicBell system, and the recipient email must include the `MAGICBELL_EMAIL` in plus format.
- Action `fetch`:
  - The command input format is `go run main.go fetch`.
  - The stdout should print: `Fetched workflow: test-workflow-<run-id>`.
- Action `delete`:
  - The command input format is `go run main.go delete`.
  - The stdout should print: `Deleted workflow: test-workflow-<run-id>`.
  - The workflow must be deleted from the MagicBell system.

