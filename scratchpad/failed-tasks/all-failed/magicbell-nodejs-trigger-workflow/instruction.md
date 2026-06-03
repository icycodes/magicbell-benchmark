# Trigger a MagicBell Workflow using Node.js SDK

## Background
MagicBell workflows allow orchestrating multi-step notification campaigns. You have an existing workflow configured in your project. Write a Node.js script using the `magicbell-js` SDK to trigger this workflow for a specific user.

## Requirements
- Write a Node.js script that triggers an existing workflow run.
- The workflow key to trigger is `welcome-workflow-${run-id}` (where `${run-id}` is read from the `ZEALT_RUN_ID` environment variable).
- The workflow expects an input payload containing the user's email address. You must pass `input: { user: { email: "<receiver_email>" } }`.
- The `<receiver_email>` must be constructed using the plus format: `${MAGICBELL_EMAIL}+${run-id}@gmail.com`.
- Save the resulting workflow run ID to a log file.

## Implementation Hints
- Install and use the `magicbell-js` SDK.
- Initialize the `ProjectClient` using the `MAGICBELL_PROJECT_TOKEN` environment variable.
- Use the `workflows.createWorkflowRun` method to execute the workflow.
- Ensure you pass the correct `key` and `input` object.
- Write the returned run ID to `/home/user/magicbell-trigger/output.log`.

## Acceptance Criteria
- Project path: /home/user/magicbell-trigger
- Ensure the script is executed and the artifact exists.
- Log file: /home/user/magicbell-trigger/output.log
- The log file must contain the workflow run ID in the format: `Run ID: <run_id>`.
- The workflow run must be created successfully for the key `welcome-workflow-${run-id}`.
- The workflow run input must contain the correct email address.
