# Inspect MagicBell Project Events with the Node.js SDK

## Background
MagicBell publishes a per-project event stream that records broadcasts, notifications, and delivery activity. Operators frequently use this stream to verify that a notification they just sent has been picked up by the platform. In this task you will use the modern `magicbell-js` SDK (project client) to send one distinguishable broadcast and then look it up again via `events.listEvents`, persisting the matched event for later inspection.

## Requirements
- Create a Node.js project under `/home/user/myproject`.
- Install the modern `magicbell-js` SDK.
- Write a single JavaScript program (`index.js`) that:
  1. Reads `ZEALT_RUN_ID`, `MAGICBELL_EMAIL`, and `MAGICBELL_PROJECT_TOKEN` from the environment.
  2. Sends a fresh broadcast with title `Events Demo - <run-id>` and content `Probing events stream for run <run-id>.`. The recipient is the email address obtained by sub-addressing `MAGICBELL_EMAIL` with the local-suffix `list-events-js-<run-id>` (i.e. `<local>+list-events-js-<run-id>@<domain>`).
  3. Polls `events.listEvents({ limit: 50 })` (retrying briefly if needed) until it can find an event from the returned page whose data references the broadcast just created. Match by either the broadcast id returned from step 2 or the title fragment `Events Demo - <run-id>`.
  4. Writes to `/home/user/myproject/output.log` exactly two lines:
     - First line: `Event ID: <event_id>`.
     - Second line: a single-line JSON dump of the matched event object as returned by the SDK.
- Run the script so the side effects actually happen.

## Implementation Hints
- Import `Client` from `magicbell-js/project-client` and authenticate with `MAGICBELL_PROJECT_TOKEN`.
- Compose the recipient email by splitting `MAGICBELL_EMAIL` at `@` and inserting `+list-events-js-<run-id>` before the domain.
- Events appear in the stream asynchronously; a short retry loop (a few seconds total) is enough.
- When scanning the returned page, inspect each event's nested fields (e.g. broadcast id, payload title) - the title fragment `Events Demo - <run-id>` is the safest needle.
- The matched event JSON should be written with `JSON.stringify(event)` to keep it on a single line.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the script is executed and the artifacts exist.
- Log file: /home/user/myproject/output.log
- The first line of the log file must match the format: `Event ID: <event_id>`.
- The second line of the log file must be a single-line valid JSON object representing the matched event.
- The MagicBell project must contain at least one event whose data references the broadcast title `Events Demo - <run-id>` where `<run-id>` is read from `ZEALT_RUN_ID`.

