# MagicBell Workflow Lifecycle via CLI

## Background
MagicBell provides a powerful command-line interface (CLI) to manage notification workflows. In this task, you will use the MagicBell CLI to create a custom workflow definition, trigger it programmatically, and monitor its execution. You will also verify that the workflow successfully dispatches an email notification to a specified recipient.

## Requirements
1. Install and authenticate the MagicBell CLI non-interactively using manual authentication.
2. Create and save a custom workflow definition with the key `workflow-cli-${run-id}`, where `${run-id}` is read from the `ZEALT_RUN_ID` environment variable.
3. The workflow must have a single step with the `broadcast` command. The broadcast input must send an email notification to the recipient address:
   `<GMAIL_USER_NAME>+workflow_cli_${run-id}@gmail.com`
   (where `<GMAIL_USER_NAME>` is read from the `GMAIL_USER_NAME` environment variable).
4. The broadcast title must be `Workflow CLI Run ${run-id}` and the content must be `Test email from MagicBell CLI workflow lifecycle run ${run-id}`.
5. Trigger the workflow run programmatically using the MagicBell Workflows API.
6. Use the MagicBell CLI to list the runs for your workflow and retrieve the run ID of the triggered run.
7. Use the MagicBell CLI to fetch the details of that specific run ID.
8. Save the run ID and the fetched run details to a log file.

## Implementation Hints
- To authenticate the MagicBell CLI non-interactively, use the manual login flags:
  ```bash
  magicbell login --manual --email "$MAGICBELL_EMAIL" --jwt "$MAGICBELL_PROJECT_TOKEN" --api-key "$MAGICBELL_API_KEY" --secret-key "$MAGICBELL_SECRET_KEY"
  ```
- Use `magicbell workflow save --data '...'` to upsert the workflow definition.
- To trigger the workflow run programmatically, send a `POST` request to `https://api.magicbell.com/v2/workflows/runs` using `curl`. Authenticate the request by passing the Project JWT in the `Authorization: Bearer $MAGICBELL_PROJECT_TOKEN` header. The request body should be a JSON object containing the workflow `"key"`.
- Use `magicbell workflow list_runs --workflow_key "workflow-cli-${run-id}"` to retrieve the runs.
- Use `magicbell workflow fetch_run --run_id "<run_id>"` to fetch the run details.
- Write a script (e.g., `run.sh` or `run.py`) to automate this entire lifecycle.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the script is executed and the artifacts exist.
- Log file: /home/user/myproject/workflow.log
- The workflow key must be `workflow-cli-${run-id}` where `run-id` is read from the `ZEALT_RUN_ID` environment variable.
- The workflow must be created and saved successfully on MagicBell.
- The workflow run must be triggered and completed successfully.
- The log file must contain the following information:
  - The workflow key in the format: `Workflow Key: <workflow_key>`
  - The triggered run ID in the format: `Run ID: <run_id>`
  - The fetched run details or output in the format: `Run Details: <run_details_json_or_text>`

