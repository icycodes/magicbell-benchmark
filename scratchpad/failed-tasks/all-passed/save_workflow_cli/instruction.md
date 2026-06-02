# Save a MagicBell Workflow Definition via CLI

## Background
Your platform team uses MagicBell to orchestrate multi-step notification campaigns. You need to register a new workflow definition (upsert) for an onboarding broadcast using the MagicBell CLI, so it can be triggered later by other services. The workflow must contain a single `broadcast` step.

## Requirements
- Authenticate the MagicBell CLI non-interactively using the provided credentials.
- Create/upsert a workflow definition with a unique, run-scoped key.
- The workflow must contain exactly one step whose `command` is `broadcast`, with a `title` and `content` describing the onboarding message.
- Parse the JSON returned by the CLI and write the workflow key to a log file.

## Implementation Hints
- Read the current `run-id` from the `ZEALT_RUN_ID` environment variable, and use it to build a unique workflow key.
- Authenticate non-interactively with `magicbell login --manual`, passing `MAGICBELL_EMAIL`, `MAGICBELL_PROJECT_TOKEN`, `MAGICBELL_API_KEY`, and `MAGICBELL_SECRET_KEY`.
- Use `magicbell workflow save --data '<json>'` to upsert the workflow definition. The `--data` payload must include a top-level `key` and a `steps` array.
- The CLI prints the saved workflow as JSON. Parse it (e.g., with `jq`) to extract the workflow key.
- Save the result to `/home/user/magicbell-task/output.log`.

## Acceptance Criteria
- Project path: /home/user/magicbell-task
- Ensure the real workflow save action is executed against MagicBell and the log artifact exists.
- Log file: /home/user/magicbell-task/output.log
- Use MagicBell CLI for the workflow save operation.
- The workflow key must be `wf-save-cli-${run-id}` where `run-id` is read from the `ZEALT_RUN_ID` environment variable.
- The workflow must have exactly one step whose `command` is `broadcast`. The step's `input.title` must include the current `run-id`.
- The log file must contain a line in the format: `Workflow Key: <workflow_key>`.

