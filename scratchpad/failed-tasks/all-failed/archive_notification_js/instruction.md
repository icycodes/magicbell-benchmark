# Archive a User Notification with the MagicBell JS SDK

## Background
MagicBell offers a `UserClient` in its JavaScript SDK (`magicbell-js/user-client`) that lets an end user mutate their own notifications using a short-lived HS256-signed User JWT. In this task you will seed a user, fan out a broadcast to them, sign a User JWT for that user, and use the User SDK to archive the notification that was just delivered.

## Requirements
- Install and use `magicbell-js` and `jsonwebtoken` in a Node.js project under `/home/user/myproject`.
- Read the current run id from the `ZEALT_RUN_ID` environment variable and append it as a suffix to every shared identifier you create.
- Upsert a MagicBell user with `external_id = user-archive-js-${ZEALT_RUN_ID}`. Use a sub-addressed email derived from `MAGICBELL_EMAIL` (split at `@`; receiver `<local>+archive-js-${ZEALT_RUN_ID}@<domain>`).
- Send a broadcast titled `Archive JS - ${ZEALT_RUN_ID}` whose only recipient is the user above (target by `external_id`). Do not modify the project-wide Delivery Planner; rely on the pre-configured `in_app`/`email` channels.
- Generate an HS256 User JWT for that user (`user_email`, `user_external_id`, `api_key` payload signed with `MAGICBELL_SECRET_KEY`).
- Instantiate a `magicbell-js` `UserClient`, locate the notification that matches the broadcast title above, call the archive endpoint on it, and write the archived notification id to a log file.

## Implementation Hints
- Both the project- and user-scoped SDK clients live in `magicbell-js`. Pick the right one for each step (`project-client` for upsert + broadcast, `user-client` for listing and archiving).
- The broadcast may take a few seconds to fan out to the in-app channel. Poll `notifications.listNotifications` until a notification whose `title` matches `Archive JS - ${ZEALT_RUN_ID}` appears, then archive it by id.
- Verify which method on the User SDK's notifications service performs the archive action; do not guess.
- Read `MAGICBELL_PROJECT_TOKEN`, `MAGICBELL_API_KEY`, `MAGICBELL_SECRET_KEY`, `MAGICBELL_EMAIL`, and `ZEALT_RUN_ID` from the process environment. Never hardcode them.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the script is executed and the artifacts exist (the broadcast must really fan out and the notification must really be archived through MagicBell).
- Log file: /home/user/myproject/output.log
- The log file MUST contain a single line in the exact format: `Archived Notification ID: <notification_id>` where `<notification_id>` is the MagicBell notification id that was archived.
- A MagicBell user with `external_id = user-archive-js-${ZEALT_RUN_ID}` must exist.
- A broadcast titled `Archive JS - ${ZEALT_RUN_ID}` must have been delivered to that user.
- The archived notification's `archived_at` field (as returned by the MagicBell REST API) must be a non-null timestamp.

