# Fetch MagicBell System Events

## Background
MagicBell provides a ProjectClient for administrative operations, including fetching system events. You need to write a Node.js script that generates an event and then fetches the most recent system events.

## Requirements
- Initialize the MagicBell Node.js `ProjectClient`.
- Create a broadcast notification to `{MAGICBELL_EMAIL}+${run-id}@gmail.com` with the title `Test Event ${run-id}`. This ensures a new system event is generated.
- Fetch the most recent system events with a limit of 5.
- Save the fetched events array to a file named `events.json`.

## Implementation Hints
- Read the `run-id` from the `ZEALT_RUN_ID` environment variable.
- Read `MAGICBELL_EMAIL` from the environment variables.
- Use the `magicbell-js/project-client` to create the broadcast and list events.
- Pass `{ limit: 5 }` to the list events method.
- Write the `data` array from the events response to `events.json` using the `fs` module.

## Acceptance Criteria
- Project path: /home/user/magicbell-task
- Command: `node index.js`
- The command must execute successfully and create a file `/home/user/magicbell-task/events.json`.
- The `events.json` file must contain a JSON array of up to 5 event objects.
- The broadcast must be sent to `{MAGICBELL_EMAIL}+${run-id}@gmail.com`.

