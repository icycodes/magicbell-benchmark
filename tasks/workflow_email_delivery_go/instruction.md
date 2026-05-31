# MagicBell Workflow Email Delivery in Go

## Background
MagicBell provides a powerful Go SDK to manage notification workflows programmatically. In this task, you will implement a Go program that creates a custom notification workflow and triggers it to send an email notification to a user's inbox.

## Requirements
- Implement a Go program (`main.go`) that uses the official `github.com/magicbell/magicbell-go` SDK.
- Read the following environment variables:
  - `MAGICBELL_PROJECT_TOKEN`: The project JWT token used to authenticate the MagicBell ProjectClient.
  - `ZEALT_RUN_ID`: The unique run ID for the current execution (e.g., `zr-abcdef`).
  - `GMAIL_USER_NAME`: The Gmail user name to construct the target email address.
- Use the `ZEALT_RUN_ID` to construct a unique workflow key: `order_notification_${run_id}`.
- Create or update (save) a workflow definition with the key `order_notification_${run_id}`. The workflow definition must contain a single step:
  - Command: `broadcast`
  - Input:
    - `title`: `Order Notification - {{payload.run_id}}`
    - `content`: `Your order has been updated successfully. Run ID: {{payload.run_id}}`
    - `recipients`: `[{"email": "{{payload.email}}"}]`
- Execute (trigger) a run of the saved workflow by sending a request to the MagicBell API. The input payload for the workflow run must contain:
  - `run_id`: The value of `ZEALT_RUN_ID`.
  - `email`: `{GMAIL_USER_NAME}+${run_id}@gmail.com`.
- Print the created workflow run ID to standard output in the format: `Workflow Run ID: <run_id>`.

## Implementation Hints
- Initialize the MagicBell Go SDK `ProjectClient` using `clientconfig.NewConfig()` and `client.NewClient(config)`. Set the access token using `config.SetAccessToken(...)` or `sdk.SetAccessToken(...)`.
- Use `sdk.Workflows.SaveWorkflow` to save the workflow definition.
- Use `sdk.Workflows.CreateWorkflowRun` to execute the workflow with the input parameters.
- Both `WorkflowDefinitionSteps.Input` and `ExecuteWorkflowRequest.Input` are of type `any` (or `interface{}`), so you can pass maps directly.
- Ensure `go.mod` is properly configured with the `github.com/magicbell/magicbell-go` dependency.

## Acceptance Criteria
- Project path: /home/user/myproject
- Command: go run main.go
- The stdout of the command must print the workflow run ID in the format: `Workflow Run ID: <run_id>`.
- The workflow must be successfully saved in MagicBell with the key `order_notification_${run_id}` where `run_id` is the value of `ZEALT_RUN_ID`.
- A workflow run must be triggered, which in turn broadcasts an email to `{GMAIL_USER_NAME}+${run_id}@gmail.com`.

