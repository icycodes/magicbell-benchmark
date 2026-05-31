# MagicBell Workflow Lifecycle and Execution in Go

## Background
In modern web architectures, notification delivery is often managed through multi-step notification campaigns called workflows. MagicBell allows developers to programmatically create, manage, and execute these workflows. The official Go SDK (`github.com/magicbell/magicbell-go`) provides high-performance, strongly-typed interfaces to interact with these administrative features via the `WorkflowsService`.

## Requirements
- Initialize the MagicBell Go SDK Project Client using the administrative `MAGICBELL_PROJECT_TOKEN` environment variable.
- Read the current `ZEALT_RUN_ID` and `GMAIL_USER_NAME` environment variables.
- Create and save a new workflow definition:
  - The workflow key must be exactly `lifecycle-${run_id}` where `${run_id}` is the value of `ZEALT_RUN_ID`.
  - The workflow must contain a single `broadcast` step.
  - The step's input must configure a broadcast that sends an email notification to `{GMAIL_USER_NAME}+${run_id}@gmail.com`.
  - The broadcast title must be exactly `Lifecycle Test ${run_id}`.
- Programmatically execute the workflow run using the Go SDK.
- Retrieve the runs for this workflow key to verify that the run exists.
- Write the workflow key, the triggered workflow run's ID, and the recipient email to `/home/user/myproject/output.log`.

## Implementation Hints
- Read the current `run-id` from the `ZEALT_RUN_ID` environment variable.
- Build the workflow key as `lifecycle-${run_id}`.
- Set up the Go project under `/home/user/myproject` with a `go.mod` file and install the official Go SDK `github.com/magicbell/magicbell-go`.
- Use `workflows.WorkflowDefinition` to define your workflow and call `sdk.Workflows.SaveWorkflow`.
- Use `workflows.ExecuteWorkflowRequest` to trigger the workflow run and call `sdk.Workflows.CreateWorkflowRun`.
- Write the resulting log file to `/home/user/myproject/output.log`.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the real workflow creation and execution action is performed, and the log file exists.
- Log file: /home/user/myproject/output.log
- The workflow key must be `lifecycle-${run_id}` where `run-id` is read from the `ZEALT_RUN_ID` environment variable.
- The log file must contain the following information exactly:
  ```
  Workflow Key: lifecycle-${run_id}
  Run ID: <run_id>
  Recipient: ${GMAIL_USER_NAME}+${run_id}@gmail.com
  ```
- The workflow run must successfully execute and deliver an email to `{GMAIL_USER_NAME}+${run_id}@gmail.com`.

