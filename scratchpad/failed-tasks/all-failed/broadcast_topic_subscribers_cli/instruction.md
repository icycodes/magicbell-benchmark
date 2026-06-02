# Broadcast to Topic Subscribers with the MagicBell CLI

## Background
MagicBell lets you fan a single broadcast out to every subscriber of a topic instead of having to enumerate recipients one by one. The recipient form for this is subtle and easy to mis-type: a broadcast targeted at topic subscribers MUST use the nested filter object `{ "topic": { "subscribers": true } }`. Passing the topic key as a bare string (e.g. `{ "topic": "topic-..." }`), or as a top-level recipient field, will be rejected and no notification will be delivered (see MagicBell Discussion #213).

This task uses the `magicbell` CLI together with a small REST call to:

1. Authenticate the CLI non-interactively.
2. Upsert two MagicBell users with `run-id`-scoped identifiers and sub-addressed emails.
3. Subscribe both users to the same topic, keyed `topic-cli-${ZEALT_RUN_ID}`.
4. Create a broadcast tagged with that topic and targeting every subscriber of the topic.
5. Persist the resulting broadcast id to a log file so the verifier can fetch it.

## Requirements
- Work inside the project directory `/home/user/magicbell-task`.
- Authenticate the MagicBell CLI non-interactively using the credentials provided via environment variables.
- Read `ZEALT_RUN_ID`, `MAGICBELL_EMAIL`, `MAGICBELL_PROJECT_TOKEN`, `MAGICBELL_API_KEY`, and `MAGICBELL_SECRET_KEY` from the environment.
- Compute two recipient emails by splitting `MAGICBELL_EMAIL` at the `@` character into `<local>@<domain>` and forming:
  - `<local>+topic-subs-cli-1-${ZEALT_RUN_ID}@<domain>`
  - `<local>+topic-subs-cli-2-${ZEALT_RUN_ID}@<domain>`
- Upsert two MagicBell users via `magicbell user save` with the following attributes:
  - User 1: `external_id` = `user-topic-subs-cli-1-${ZEALT_RUN_ID}`, `email` = recipient email 1, `first_name` = `TopicSubsCli`, `last_name` = `One-${ZEALT_RUN_ID}`.
  - User 2: `external_id` = `user-topic-subs-cli-2-${ZEALT_RUN_ID}`, `email` = recipient email 2, `first_name` = `TopicSubsCli`, `last_name` = `Two-${ZEALT_RUN_ID}`.
- Subscribe each of those users to the topic `topic-cli-${ZEALT_RUN_ID}`. After both subscription calls, the topic must have BOTH user external ids listed as subscribers.
- Create exactly one broadcast via `magicbell broadcast create --data '<json>'` with:
  - `title` = `Topic Subs CLI - ${ZEALT_RUN_ID}`.
  - `content` = a short description string.
  - `topic` = `topic-cli-${ZEALT_RUN_ID}` (the same topic key used for the subscriptions, so the broadcast itself is tagged with the topic).
  - `recipients` = a single entry that uses the nested topic-subscribers filter form (the `{ topic: { subscribers: true } }` shape from MagicBell Discussion #213).
- Parse the CLI output of the broadcast call, extract the assigned broadcast `id`, and write a single line to the log file `/home/user/magicbell-task/output.log` in the format: `Broadcast ID: <broadcast_id>`.
- The script must run end-to-end non-interactively and must not modify the project-wide Delivery Planner.

## Implementation Hints
- Authenticate the CLI with `magicbell login --manual` using `--email`, `--jwt`, `--api-key`, and `--secret-key` flags wired to the corresponding environment variables.
- `magicbell user save --data '<json>'` upserts a user; the CLI prints the saved user as JSON, so tools like `jq` are available to extract fields if needed.
- The friction point: a broadcast targeted at topic subscribers MUST use the nested recipient filter shape `{ topic: { subscribers: true } }`. A bare-string topic value, a `{ topic: "topic-..." }` form, or `{ topicKey: ... }` will all fail to fan out.
- The broadcast payload must also carry a top-level `topic` field so the notification is classified under the same topic the subscribers are subscribed to.
- Topic subscriptions are a user-context resource. The CLI may not expose a subcommand for creating them under an arbitrary external id; the reliable, portable approach is to call the MagicBell REST endpoint directly: `POST https://api.magicbell.com/subscriptions` (note: NOT the `/v2` host) with headers `X-MAGICBELL-API-KEY: ${MAGICBELL_API_KEY}`, `X-MAGICBELL-USER-EXTERNAL-ID: <external_id>`, and `Content-Type: application/json`, sending body `{"subscription":{"topic":"topic-cli-${ZEALT_RUN_ID}"}}`. `curl` is available for this.
- Both users must be successfully upserted before issuing the subscription requests, otherwise the user-context subscription call will return a 4xx.
- The broadcast id is returned as the `id` field in the CLI's JSON output; capture it precisely (no surrounding whitespace, quotes, or `Broadcast ID:` prefix) when writing the log line.

## Acceptance Criteria
- Project path: /home/user/magicbell-task
- Ensure the real broadcast creation, user upserts, and topic subscriptions are executed against MagicBell, and the log artifact exists.
- Log file: /home/user/magicbell-task/output.log
- Use the MagicBell CLI (`magicbell user save` and `magicbell broadcast create`) for the user upserts and the broadcast creation.
- All shared identifiers must be suffixed with `${ZEALT_RUN_ID}` so concurrent runs do not collide. In particular, the topic key must be `topic-cli-${ZEALT_RUN_ID}` and the user `external_id`s must be `user-topic-subs-cli-1-${ZEALT_RUN_ID}` and `user-topic-subs-cli-2-${ZEALT_RUN_ID}`.
- The log file must contain a single line matching the format: `Broadcast ID: <broadcast_id>`.
- The broadcast (fetched via `GET https://api.magicbell.com/v2/broadcasts/<broadcast_id>`) must:
  - Have `title` equal to `Topic Subs CLI - ${ZEALT_RUN_ID}`.
  - Have `topic` equal to `topic-cli-${ZEALT_RUN_ID}`.
  - Have `recipients` containing at least one entry whose `topic` field is an object with `subscribers == true` (the nested topic-subscribers filter form).
- Both `user-topic-subs-cli-1-${ZEALT_RUN_ID}` and `user-topic-subs-cli-2-${ZEALT_RUN_ID}` must show a topic subscription record for `topic-cli-${ZEALT_RUN_ID}` when fetched via `GET https://api.magicbell.com/subscriptions` with headers `X-MAGICBELL-API-KEY` and `X-MAGICBELL-USER-EXTERNAL-ID`.

