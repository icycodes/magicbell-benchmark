# Create a Conditional Workflow with MagicBell Node.js SDK

## Background
MagicBell workflows allow orchestrating multi-step notification campaigns. You can use conditional logic to branch your workflows based on user data, event properties, or custom conditions.

## Requirements
- Write a Node.js script that creates a new workflow definition using the MagicBell Node.js SDK (`magicbell-js`).
- The workflow key must be `conditional-workflow-${run-id}`.
- The workflow must contain a single `broadcast` step.
- The step must include a conditional `if` property that checks if the user's custom attribute `plan` equals `'premium'`.
- The broadcast step should define a title and content for the notification.

## Implementation Hints
1. Read the current `run-id` from the `ZEALT_RUN_ID` environment variable.
2. Use the `Client` from `magicbell-js/project-client` to save the workflow.
3. The `if` property in the step definition is a string (e.g., `"user.custom_attributes.plan == 'premium'"`).
4. Ensure the script is executed and the workflow is created in MagicBell.

## Acceptance Criteria
- Project path: /home/user/task
- Command: `node index.js`
- The command must execute successfully and create the workflow in MagicBell.
- The created workflow must have the key `conditional-workflow-${run-id}`.
- The workflow must have exactly one step with the command `broadcast` and an `if` condition checking the `plan` attribute for the value `'premium'`.

