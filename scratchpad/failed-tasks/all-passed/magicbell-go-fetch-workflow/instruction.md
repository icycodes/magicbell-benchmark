# Fetch Workflow by Key using Go SDK

## Background
You need to write a Go script that fetches a specific workflow definition by its key using the MagicBell Go SDK.

## Requirements
- Create a Go module and write a script `fetch_workflow.go`.
- The script must accept a workflow key as the first command-line argument.
- The script must use the MagicBell Go SDK (`github.com/magicbell/magicbell-go`) to fetch the workflow definition with that key.
- The script must print the workflow definition as a JSON string to standard output.
- If the workflow is not found, the script should print `Workflow not found` and exit with a non-zero status code.

## Implementation Hints
- Read the project token from the `MAGICBELL_PROJECT_TOKEN` environment variable.
- Initialize the SDK using `clientconfig.NewConfig()` and `client.NewClient()`.
- Note: The `FetchWorkflow` method in the Go SDK may be incorrectly generated and missing the key parameter. You should use `FetchWorkflows` to retrieve all workflows and then iterate over the items to find the one matching the requested key.
- Use `json.Marshal` or `json.MarshalIndent` to format the matched workflow item.

## Acceptance Criteria
- Project path: /home/user/magicbell-go-fetch-workflow
- Command: `go run fetch_workflow.go <workflow_key>`
- For an existing workflow, the output must be valid JSON and contain the requested key.
- For a non-existent workflow, the output must include `Workflow not found`.

