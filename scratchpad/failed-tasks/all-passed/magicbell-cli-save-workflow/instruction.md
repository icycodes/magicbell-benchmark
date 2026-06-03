# Save MagicBell Workflow with CLI

## Background
MagicBell provides a CLI to manage your project's resources, including workflows. Workflows allow you to orchestrate multi-step notification campaigns.

## Requirements
- Create a shell script to save a workflow definition using the MagicBell CLI.
- The workflow key must be `onboarding-campaign-${run-id}`.
- The workflow must contain a single step using the `broadcast` command.
- The broadcast must include a title, content, and a hardcoded email recipient.
- The email recipient must be derived from the `MAGICBELL_EMAIL` environment variable by appending `+cli-workflow-${run-id}` to the local part of the email address (e.g., if `MAGICBELL_EMAIL` is `user@example.com`, the recipient should be `user+cli-workflow-${run-id}@example.com`).

## Implementation Hints
- Read the `ZEALT_RUN_ID` environment variable to get the `run-id`.
- Parse the `MAGICBELL_EMAIL` environment variable to construct the recipient email address.
- Use the `magicbell workflow save` command to create or update the workflow definition.
- Pass the workflow definition as a JSON string to the `--data` flag.
- Ensure the CLI is authenticated before running the command, or pass authentication flags if necessary (the environment may already have the CLI installed and authenticated, or you may need to authenticate using the provided environment variables).

## Acceptance Criteria
- Project path: /home/user/myproject
- Command: bash save_workflow.sh
- Ensure the real workflow saving action is executed.
- The script must use the MagicBell CLI (`magicbell workflow save`).
- The workflow key must be `onboarding-campaign-${run-id}`.
- The workflow must have exactly one step with the command `broadcast`.
- The broadcast input must contain a title and content.
- The broadcast input must contain a `recipients` array with a single email recipient matching the `+cli-workflow-${run-id}` format derived from `MAGICBELL_EMAIL`.

