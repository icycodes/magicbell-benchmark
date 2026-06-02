# Broadcast to Topic Subscribers with the magicbell-js Project Client

## Background
MagicBell topics let you group notifications about a specific entity (e.g., `order-123`) and lets users subscribe to that topic. When sending a broadcast, you can fan it out to every subscriber of a topic instead of having to enumerate every recipient by `externalId` or `email`. This requires a subtle, easily-mis-typed recipient form: the broadcast `recipients` array must contain the nested `{ topic: { subscribers: true } }` filter object (see MagicBell Discussion #213). Passing the topic key directly as a string, or as `{ topic: "some-key" }`, will fail with a 422 error.

In this task you will use the modern `magicbell-js` Project Client together with a small REST call to:

1. Upsert two MagicBell users.
2. Subscribe both users to the same topic, keyed `topic-${ZEALT_RUN_ID}`.
3. Create a broadcast that targets every subscriber of that topic (using the nested filter form) and that also tags the broadcast itself with the topic.
4. Persist the resulting broadcast id so the verifier can fetch it.

## Requirements
- Work inside a Node.js project under `/home/user/myproject`.
- Install and use the modern `magicbell-js` SDK to upsert users and create the final broadcast.
- The script must:
  1. Read `ZEALT_RUN_ID`, `MAGICBELL_EMAIL`, `MAGICBELL_PROJECT_TOKEN`, and `MAGICBELL_API_KEY` from environment variables.
  2. Initialise the Project Client from `magicbell-js/project-client` with `token: process.env.MAGICBELL_PROJECT_TOKEN`.
  3. Compute two recipient emails by splitting `MAGICBELL_EMAIL` at `@` into `<local>@<domain>` and forming `<local>+topic-subs-js-1-<run-id>@<domain>` and `<local>+topic-subs-js-2-<run-id>@<domain>`.
  4. Upsert two MagicBell users via `users.saveUser({...})` with:
     - User 1: `externalId: user-topic-subs-js-1-<run-id>`, `email: <plus-addressed email 1>`, `firstName: TopicSubs`, `lastName: One-<run-id>`.
     - User 2: `externalId: user-topic-subs-js-2-<run-id>`, `email: <plus-addressed email 2>`, `firstName: TopicSubs`, `lastName: Two-<run-id>`.
  5. Subscribe each user to the topic `topic-<run-id>` by issuing `POST https://api.magicbell.com/subscriptions` with:
     - Headers `X-MAGICBELL-API-KEY: ${MAGICBELL_API_KEY}` and `X-MAGICBELL-USER-EXTERNAL-ID: <user external id>` and `Content-Type: application/json`.
     - JSON body `{"subscription":{"topic":"topic-<run-id>"}}`.
     - Expect a `200 OK` response with the created subscription.
  6. Create one broadcast via `broadcasts.createBroadcast({...})` with:
     - `title`: `Topic Subs JS - <run-id>`
     - `content`: a short description such as `Broadcast to topic subscribers for run <run-id>.`
     - `topic`: `topic-<run-id>` (the same topic key used for subscriptions).
     - `recipients`: `[{ topic: { subscribers: true } }]` (the nested-filter form from MagicBell Discussion #213).
  7. Write the broadcast `id` returned by the SDK to `/home/user/myproject/output.log` in the exact format `Broadcast ID: <broadcast_id>`.
- The script must run to completion non-interactively and must not modify the project-wide Delivery Planner.

## Implementation Hints
- Topic subscriptions are user-context resources, so the project-client SDK does not expose them; you must hit the MagicBell `POST /subscriptions` REST endpoint directly (host `https://api.magicbell.com`, NOT `https://api.magicbell.com/v2`). Identify the user with the `X-MAGICBELL-USER-EXTERNAL-ID` header alongside `X-MAGICBELL-API-KEY`.
- The friction-point: broadcasts to topic subscribers MUST use the nested recipient filter `{ topic: { subscribers: true } }`. A bare string topic, `{ topic: "topic-<run-id>" }`, or `{ topicKey: ... }` will all be rejected by the API.
- The broadcast payload must also carry the `topic` field at the top level so the notification is tagged with the topic and routed to its subscribers.
- `magicbell-js` may need `tslib` alongside it depending on the npm resolver; preinstall both if the script fails to start.
- The SDK response wrappers have the shape `{ data: ... }`; pull `id` from `data`.
- Both users must be successfully upserted before issuing the subscription requests, otherwise the user-context subscription call will return a 4xx.

## Acceptance Criteria
- Project path: /home/user/myproject
- Ensure the script is executed end-to-end and the artifacts exist.
- Log file: /home/user/myproject/output.log
- The log file must contain the broadcast ID in the format: `Broadcast ID: <broadcast_id>`.
- The created broadcast (read via `GET https://api.magicbell.com/v2/broadcasts/<broadcast_id>`) must:
  - Have `title` equal to `Topic Subs JS - ${run-id}` where `run-id` is read from `ZEALT_RUN_ID`.
  - Have `topic` equal to `topic-${run-id}`.
  - Have `recipients` containing at least one entry that uses the nested topic-subscribers filter form (a `topic` field whose value is an object with `subscribers: true`).
- Both `user-topic-subs-js-1-${run-id}` and `user-topic-subs-js-2-${run-id}` must show a topic subscription record for `topic-${run-id}` when fetched via `GET https://api.magicbell.com/subscriptions` with `X-MAGICBELL-API-KEY` and `X-MAGICBELL-USER-EXTERNAL-ID` headers.

