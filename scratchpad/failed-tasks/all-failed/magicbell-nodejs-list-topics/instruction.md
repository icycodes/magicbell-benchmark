# List User Topics with MagicBell

## Background
You need to retrieve the list of topics a specific user is subscribed to using the MagicBell Node.js UserClient.

## Requirements
- Write a Node.js script that fetches the topic subscriptions for a user.
- The user's email is your `MAGICBELL_EMAIL` with a plus-suffix using the current `run-id`.
- Generate the User JWT using the `MAGICBELL_API_KEY` and `MAGICBELL_SECRET_KEY`.
- Use the `magicbell-js/user-client` to fetch the topics.
- Print the topics to standard output.

## Implementation Hints
1. Read the `ZEALT_RUN_ID` environment variable to get the `run-id`.
2. Construct the user email by splitting `MAGICBELL_EMAIL` at `@` and inserting `+${run-id}` before the domain.
3. Generate a User JWT using `jsonwebtoken` with your project's API Key and Secret Key.
4. Initialize the MagicBell UserClient (`magicbell-js/user-client`) with the generated User JWT.
5. Call the appropriate method on the client to list the user's topic subscriptions.
6. Output the list of topics (or the raw JSON response) to stdout.

## Acceptance Criteria
- Project path: /home/user/myproject
- Command: node index.js
- The stdout should print the list of topics the user is subscribed to, which must include `test-topic-${run-id}`.

