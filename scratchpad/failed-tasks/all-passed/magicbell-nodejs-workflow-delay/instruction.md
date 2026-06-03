# Create a Workflow with Delay in MagicBell

## Background
MagicBell allows you to orchestrate multi-step notification campaigns using workflows. In this task, you will create a Node.js script that uses the MagicBell Node.js SDK to define and save a workflow containing a broadcast step, a wait (delay) step, and a follow-up broadcast step.

## Requirements
- Write a Node.js script that uses the MagicBell Node.js SDK (`magicbell-js/project-client`) to save a workflow definition.
- The workflow key must be `workflow-delay-${run-id}` where `run-id` is read from the `ZEALT_RUN_ID` environment variable.
- The workflow must consist of exactly three steps in this order:
  1. `broadcast` command: Send a notification with the title "Welcome!".
  2. `wait` command: Pause the workflow execution for 60 seconds.
  3. `broadcast` command: Send a follow-up notification with the title "Follow up".

## Implementation Hints
- Read the `run-id` from the `ZEALT_RUN_ID` environment variable.
- Initialize the `magicbell-js` `ProjectClient` using the `MAGICBELL_PROJECT_TOKEN` environment variable.
- Use the `workflows.saveWorkflow` method to create the workflow definition.
- A `wait` step requires the `duration` input parameter to be specified in seconds.
- Ensure your script waits for the API call to complete before exiting.

## Acceptance Criteria
- Project path: /home/user/magicbell-task
- Command: node create-workflow.js
- Input argument format: None (reads from environment variables).
- Expected command output format: The stdout should print a success message indicating the workflow was created.

