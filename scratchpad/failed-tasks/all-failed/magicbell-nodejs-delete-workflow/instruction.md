# Delete a Workflow using Node.js ProjectClient

## Background
You need to programmatically delete an existing workflow definition using the MagicBell Node.js SDK (`magicbell-js`).

## Requirements
- Write a Node.js script that deletes an existing workflow definition.
- The workflow key to delete is `test-workflow-${run-id}`.
- You must use the `magicbell-js` ProjectClient to authenticate. If the SDK lacks a direct method to delete a workflow, you may use the client's internal configuration (e.g., token) to make a direct HTTP DELETE request to the MagicBell API.
- Save the deletion HTTP status code to a log file.

## Implementation Hints
- Read the `ZEALT_RUN_ID` environment variable to determine the `run-id`.
- The target workflow key is `test-workflow-${run-id}`.
- Authenticate using the `MAGICBELL_PROJECT_TOKEN` environment variable.
- The MagicBell API endpoint for deleting a workflow is `DELETE https://api.magicbell.com/workflows/{workflow_key}`.
- Write the resulting HTTP status code to `/home/user/task/output.log`.

## Acceptance Criteria
- Project path: /home/user/task
- Ensure the script is executed and the workflow is actually deleted from the MagicBell project.
- Log file: /home/user/task/output.log
- The log file must contain the status code in the format: `Status: <status_code>`.
- The workflow `test-workflow-${run-id}` must no longer exist in the MagicBell project.
