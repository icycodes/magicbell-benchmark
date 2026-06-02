# Save and Trigger a MagicBell Workflow Run with the magicbell-js Project Client

## Background
MagicBell workflows let you compose multi-step notification pipelines. The modern `magicbell-js` Project Client exposes `workflows.saveWorkflow(...)` to upsert workflow definitions and `workflows.createWorkflowRun(...)` to execute them with input parameters. Workflow steps can reference workflow `input` fields via Liquid templates (e.g., `{{ marker }}`). In this task, you will use the SDK to (1) upsert a MagicBell user, (2) save a workflow whose only step broadcasts a notification with a Liquid-templated title, and (3) trigger one run with concrete input. The resulting workflow run ID must be written to an output log for downstream verification.

## Requirements
- Create a Node.js project under `/home/user/myproject`.
- Install the modern `magicbell-js` SDK and run the script with Node.js.
- The script must:
  1. Read `ZEALT_RUN_ID`, `MAGICBELL_EMAIL`, and `MAGICBELL_PROJECT_TOKEN` from environment variables.
  2. Initialize the Project Client from `magicbell-js/project-client` with `token: process.env.MAGICBELL_PROJECT_TOKEN`.
  3. Compute the recipient email by splitting `MAGICBELL_EMAIL` at `@` into `<local>@<domain>`, then forming `<local>+trigger-js-<run-id>@<domain>` (plus-addressing).
  4. Upsert a MagicBell user via `users.saveUser({...})` with:
     - `externalId`: `user-trigger-js-<run-id>`
     - `email`: the plus-addressed email above
     - `firstName`: `Trigger`
     - `lastName`: `Workflow-<run-id>`
  5. Save a workflow via `workflows.saveWorkflow({...})` with:
     - `key`: `wf-trigger-js-<run-id>`
     - `steps`: a single `broadcast` step whose `input` sets the broadcast `title` to a Liquid template referencing the workflow input field `marker` (e.g., `Trigger JS Run {{ marker }}`), and targets the user created above by `externalId`.
  6. Trigger one workflow run via `workflows.createWorkflowRun({...})` with:
     - `key`: `wf-trigger-js-<run-id>`
     - `input`: an object containing `recipient_external_id: user-trigger-js-<run-id>` and `marker: trigger-js-<run-id>`.
  7. Write the resulting workflow run `id` to `/home/user/myproject/output.log` in the format `Workflow Run ID: <run_id>`.
- The script must run to completion non-interactively.

## Implementation Hints
- Import `Client` from `magicbell-js/project-client` and authenticate with `token: process.env.MAGICBELL_PROJECT_TOKEN`.
- `workflows.saveWorkflow` is an upsert keyed by `key`; `workflows.createWorkflowRun` returns a response whose `data.id` is the run identifier.
- Workflow step `input` values may contain Liquid placeholders like `{{ marker }}` that get resolved at run time from the `input` you pass to `createWorkflowRun`.
- The SDK response wrappers all have the shape `{ data: ... }`; pull `id` from `data`.
- Handle async calls properly (e.g., `await` or `.then`) and ensure the process writes the log before exiting.
- Do not modify the project-wide Delivery Planner or any preset channel configuration.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the script is executed and the artifacts exist.
- Log file: /home/user/myproject/output.log
- The log file must contain the workflow run ID in the format: `Workflow Run ID: <run_id>`.
- The created MagicBell workflow definition must exist with `key` equal to `wf-trigger-js-${run-id}` (run-id read from `ZEALT_RUN_ID`).
- The triggered workflow run must:
  - Be retrievable via the MagicBell REST API at `GET /v2/workflows/runs/<run_id>`.
  - Have its run `key` equal to `wf-trigger-js-${run-id}`.
  - Appear in the listing at `GET /v2/workflows/wf-trigger-js-${run-id}/runs`.

