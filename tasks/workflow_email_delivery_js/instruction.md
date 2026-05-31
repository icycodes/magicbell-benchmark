# MagicBell Workflow Email Delivery in JavaScript

## Background
MagicBell provides a powerful Workflows API that allows developers to orchestrate multi-step notification campaigns. In this task, you will use the modern `magicbell-js` SDK to programmatically save a workflow definition and trigger a workflow run. The workflow will use liquid-style templating to dynamically populate notification fields and send an email to a test user.

## Requirements
- Initialize the `magicbell-js` ProjectClient using the provided `MAGICBELL_PROJECT_TOKEN` environment variable.
- Define and save a workflow definition with a unique key using the pattern `onboarding-workflow-${run-id}` where `run-id` is read from the `ZEALT_RUN_ID` environment variable.
- The workflow definition must consist of a single step that executes a `broadcast` command. The broadcast step should pass inputs to dynamically render the notification:
  - Title: `"Welcome to MagicBell, {{input.run_id}}!"`
  - Content: `"This is a test notification for run {{input.run_id}}."`
  - Recipients: A single recipient with the email `"{{input.user_email}}"`.
- Trigger a workflow run for this workflow definition by passing the following inputs:
  - `run_id`: The current `run-id` value.
  - `user_email`: The recipient's email address, constructed as `${GMAIL_USER_NAME}+${run-id}@gmail.com` where `GMAIL_USER_NAME` is read from the `GMAIL_USER_NAME` environment variable.
- Write the resulting workflow run ID to a log file.

## Implementation Hints
- Read `ZEALT_RUN_ID` and `GMAIL_USER_NAME` from the environment to construct the workflow key and recipient email.
- Import `Client` from `'magicbell-js/project-client'` to initialize the project-level administrative client.
- Use `client.workflows.saveWorkflow` to upsert the workflow definition, and `client.workflows.createWorkflowRun` to execute the workflow run.
- Liquid templates use double curly braces (e.g., `{{input.some_field}}`) to access variables passed in the workflow run input.

## Acceptance Criteria
- Project path: `/home/user/myproject`
- Ensure the script is executed, the workflow run is successfully triggered, and the log artifact exists.
- Log file: `/home/user/myproject/output.log`
- The script must use `magicbell-js` to save the workflow definition and execute the workflow run.
- The workflow key must be `onboarding-workflow-${run-id}` where `run-id` is read from `ZEALT_RUN_ID`.
- The recipient email must be `${GMAIL_USER_NAME}+${run-id}@gmail.com` where `GMAIL_USER_NAME` is read from the environment.
- The log file must contain the triggered workflow run ID in the format: `Workflow Run ID: <run_id>`.

