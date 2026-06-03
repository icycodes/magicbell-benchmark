# List Workflows with Go SDK

## Background
You need to use the MagicBell Go SDK to list all workflows configured in the project.

## Requirements
- Initialize the MagicBell Project Client using the Go SDK.
- Fetch all workflow definitions in the project.
- Print the `Key` of each fetched workflow to standard output.

## Implementation Hints
- The MagicBell Go SDK provides a `Workflows` service on the project client.
- Use `FetchWorkflows` to retrieve the list of workflows.
- Iterate through the returned workflows and print each workflow's key.
- Use `MAGICBELL_PROJECT_TOKEN` to authenticate the project client.
- Read the `run-id` from the `ZEALT_RUN_ID` environment variable. If you create any temporary workflows for testing, ensure their keys are suffixed with this `run-id`.

## Acceptance Criteria
- Project path: `/home/user/magicbell-go-list-workflows`
- Command: `go run main.go`
- The stdout should print the workflow keys.

