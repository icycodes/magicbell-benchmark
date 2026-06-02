# Save and Trigger a MagicBell Workflow Run with the Go SDK Project Client

## Background
MagicBell Workflows let you compose multi-step notification pipelines that can be triggered with runtime input. The official Go SDK (`github.com/magicbell/magicbell-go`) exposes a `ProjectClient` with `Workflows.SaveWorkflow(...)` for upserting workflow definitions and `Workflows.CreateWorkflowRun(...)` for executing them with input parameters. Workflow step inputs can reference workflow run input fields via Liquid templates (e.g., `{{ marker }}`). In this task, you will use the Go SDK to (1) save a workflow whose only step is a `broadcast` with a Liquid-templated title and a recipient email, (2) trigger one run of that workflow with concrete input, and (3) write the resulting workflow run ID to an output log file.

## Requirements
- Initialize a Go project under `/home/user/myproject` (`go mod init myproject` and `go get github.com/magicbell/magicbell-go`).
- Write a Go program (`main.go`) that uses the MagicBell Go SDK's `ProjectClient` to:
  1. Read `ZEALT_RUN_ID`, `MAGICBELL_EMAIL`, and `MAGICBELL_PROJECT_TOKEN` from environment variables.
  2. Compute the recipient email by splitting `MAGICBELL_EMAIL` at `@` into `<local>@<domain>`, then forming `<local>+trigger-go-<run-id>@<domain>` (plus-addressing).
  3. Upsert a workflow via `Workflows.SaveWorkflow(...)` with:
     - `key`: `wf-trigger-go-<run-id>`
     - `steps`: exactly one step with `command` equal to `broadcast` whose `input` sets the broadcast `title` to a Liquid template referencing the workflow input field `marker` (e.g., `Trigger Go Run {{ marker }}`), provides a `content` string, and targets the computed recipient email address.
  4. Trigger one workflow run via `Workflows.CreateWorkflowRun(...)` with:
     - `key`: `wf-trigger-go-<run-id>`
     - `input`: a JSON object containing `marker: trigger-go-<run-id>`.
  5. Write the resulting workflow run ID to `/home/user/myproject/output.log` in the format `Workflow Run ID: <run_id>`.
- The program must run to completion non-interactively.

## Implementation Hints
- Initialize the SDK with `client.NewClient(clientconfig.NewConfig())` and call `config.SetAccessToken(...)` with the project token. The relevant packages live under `github.com/magicbell/magicbell-go/pkg/project-client/...` (see `client`, `clientconfig`, `workflows`, `util`).
- Use `util.ToPointer` to populate pointer fields on `workflows.WorkflowDefinition`, `workflows.WorkflowDefinitionSteps`, and `workflows.ExecuteWorkflowRequest`.
- `workflows.WorkflowDefinitionSteps.Input` and `workflows.ExecuteWorkflowRequest.Input` are `[]byte`; marshal a JSON object with `encoding/json` and pass the resulting bytes.
- The `Workflows.CreateWorkflowRun` response wrapper exposes the run identifier on the returned object; pull the run ID from that field and write it to the log.
- Workflow step `input` values may contain Liquid placeholders like `{{ marker }}` that get resolved at run time from the `input` passed to `CreateWorkflowRun`.
- Do not modify the project-wide Delivery Planner or any preset channel configuration.
- Do not hardcode credentials. Read all sensitive values from environment variables.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the Go program is executed, the workflow is upserted on MagicBell, the run is triggered, and the log artifact exists.
- Log file: /home/user/myproject/output.log
- The Go program must use the official Go SDK (`github.com/magicbell/magicbell-go`) and the `ProjectClient.Workflows.SaveWorkflow` and `ProjectClient.Workflows.CreateWorkflowRun` methods.
- The created MagicBell workflow definition must exist with `key` equal to `wf-trigger-go-${run-id}` (run-id read from `ZEALT_RUN_ID`).
- The triggered workflow run must:
  - Be retrievable via the MagicBell REST API at `GET /v2/workflows/runs/<run_id>`.
  - Have its workflow `key` equal to `wf-trigger-go-${run-id}`.
  - Appear in the listing at `GET /v2/workflows/wf-trigger-go-${run-id}/runs`.
- The log file must contain the workflow run ID in the format: `Workflow Run ID: <run_id>`.

