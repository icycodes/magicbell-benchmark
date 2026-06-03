# Mark All Notifications as Read

## Background
Using the MagicBell Node.js SDK (`magicbell-js`), you can perform actions on behalf of a specific user. This task requires you to create a script that generates a User JWT and uses the UserClient to mark all of a user's notifications as read.

## Requirements
- Create a Node.js script that accepts a user email via a CLI argument (`--user-email`).
- Generate a User JWT for the provided email using the `MAGICBELL_API_KEY` and `MAGICBELL_SECRET_KEY` environment variables.
- Use the `magicbell-js/user-client` to mark all notifications as read for that user.
- Print a success message to stdout when finished.

## Implementation Hints
- Use a library like `jsonwebtoken` to sign the User JWT with your `MAGICBELL_SECRET_KEY` and `MAGICBELL_API_KEY`.
- Instantiate the `Client` from `magicbell-js/user-client` with the generated token.
- Call the appropriate method on the `notifications` service to mark all notifications as read.

## Acceptance Criteria
- Project path: /home/user/magicbell-task
- Command: node index.js --user-email <email>
- The script must successfully execute the real API call to mark all notifications as read for the given user.
- The stdout should print: `Successfully marked all notifications as read`

