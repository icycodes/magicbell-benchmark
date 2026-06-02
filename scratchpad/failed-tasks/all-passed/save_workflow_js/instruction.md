# Save a MagicBell Workflow with the Node.js Project SDK

## Background
MagicBell workflows orchestrate multi-step notification campaigns. The Project Client in the modern `magicbell-js` SDK exposes a `workflows.saveWorkflow()` method that upserts a workflow definition identified by its `key`. In this task you will create/upsert a workflow that contains a single broadcast step, using a `run-id`-scoped key so it is safe to run concurrently.

## Requirements
- Create a Node.js project under `/home/user/myproject`.
- Install the modern `magicbell-js` SDK (the `magicbell-js` package, NOT the deprecated `magicbell` package).
- Read the `ZEALT_RUN_ID` environment variable and build the workflow key `wf-save-${ZEALT_RUN_ID}`.
- Write a Node.js script that uses the Project Client (`magicbell-js/project-client`) to call `workflows.saveWorkflow()` with:
  - `key`: `wf-save-<run-id>`
  - `steps`: exactly one step with `command: "broadcast"` and an `input` object containing both `title` and `content`. The `title` MUST include the literal `run-id` value (so it can be correlated downstream). The `content` may use a Liquid placeholder such as `{{ run_id }}` to demonstrate workflow templating.
- Execute the script (no mocking) so the workflow is actually saved in MagicBell.
- Record the saved workflow key in a log file so the verifier can locate it.

## Implementation Hints
- Initialize the Project Client with `MAGICBELL_PROJECT_TOKEN` from the environment.
- `saveWorkflow()` is an upsert: re-running the script with the same key updates the existing definition. This makes the task safely retryable.
- The Project Client's response exposes the saved workflow's `key` field; you can use it directly when writing the log.
- Make sure your script is fully non-interactive and awaits the asynchronous SDK call before exiting.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the script is executed and the workflow is actually saved in MagicBell.
- Log file: /home/user/myproject/output.log
- The log file must contain a line in the format: `Workflow Key: <workflow_key>` where `<workflow_key>` equals `wf-save-${ZEALT_RUN_ID}`.

