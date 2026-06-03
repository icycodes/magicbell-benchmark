# Update User Timezone via Go SDK

## Background
MagicBell allows you to store custom attributes for users, which is useful for personalizing notifications based on user preferences like their timezone. In this task, you will use the MagicBell Go SDK (`github.com/magicbell/magicbell-go`) to create or update a user and set their timezone via custom attributes.

## Requirements
- Initialize the `magicbell-go` ProjectClient using the `MAGICBELL_PROJECT_TOKEN` environment variable.
- Create or update a user with the external ID `user-tz-${run-id}`.
- Set their email to the plus format: the value of `MAGICBELL_EMAIL` with `+tz-${run-id}` appended before the `@` symbol (e.g., if `MAGICBELL_EMAIL` is `test@gmail.com`, the email should be `test+tz-${run-id}@gmail.com`).
- Set a custom attribute `timezone` to `America/New_York`.
- The Go application should be executed to perform this update.

## Implementation Hints
1. Read the current `run-id` from the `ZEALT_RUN_ID` environment variable.
2. Read the `MAGICBELL_EMAIL` and `MAGICBELL_PROJECT_TOKEN` environment variables.
3. Construct the email by splitting the `MAGICBELL_EMAIL` at the `@` symbol and inserting `+tz-${run-id}`.
4. Use the `users` package from the `magicbell-go` SDK to save the user.
5. Use the `CustomAttributes` field on the user model to store the timezone.

## Acceptance Criteria
- Project path: /home/user/app
- Command: go run main.go
- Ensure the user is successfully created/updated in MagicBell with the correct `external_id`, `email`, and `custom_attributes`.

