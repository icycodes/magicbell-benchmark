# Update User Email with MagicBell Go SDK

## Background
MagicBell allows managing users programmatically. You need to create a Go CLI script that uses the MagicBell Go SDK (ProjectClient) to update a user's email address.

## Requirements
- Write a Go script (`update_email.go`) that accepts an external ID and a new email address as command-line arguments.
- Use the `github.com/magicbell/magicbell-go` SDK's ProjectClient to update (upsert) the user with the provided external ID, setting their email to the provided new email address.
- Authenticate using the `MAGICBELL_PROJECT_TOKEN` environment variable.
- The script should print a success message containing the updated email.

## Implementation Hints
- Initialize a Go module in the project directory and get the MagicBell Go SDK.
- Use `clientconfig.NewConfig()` and set the access token from the environment.
- Create a new ProjectClient and use the `Users.SaveUser` method to upsert the user by their `ExternalId`.
- Pass the external ID and email from `os.Args`.

## Acceptance Criteria
- Project path: `/home/user/magicbell-go-update-user-email`
- Command: `go run update_email.go <external_id> <new_email>`
- The command should update the user in MagicBell.
- The stdout should print: `User updated: <new_email>`

