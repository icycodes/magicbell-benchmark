# Fetch a User by External ID

## Background
You have a MagicBell project. Write a Go program that uses the MagicBell Go SDK `ProjectClient` to fetch an existing user by their external ID and print their email address.

## Requirements
- The program must be written in Go.
- Use the `github.com/magicbell/magicbell-go` SDK.
- The program should take the user's external ID as a command-line argument (e.g. `--external-id <id>`).
- The program should fetch the user and print their email address to stdout.

## Implementation Hints
- Initialize the `ProjectClient` using the `MAGICBELL_PROJECT_TOKEN` environment variable.
- Note that the Go SDK's `UsersService` might not have a dedicated `GetUser` method. You may need to use `ListUsers` or `SaveUser` (upsert) to retrieve the user's information based on their external ID.
- Parse the `--external-id` argument using the standard `flag` package.
- Print the email address of the user to stdout.

## Acceptance Criteria
- Project path: /home/user/go-task
- Command: go run main.go --external-id <external_id>
- The stdout should print the user's email address.

