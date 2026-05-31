# GitHub Webhook Receiver for MagicBell Notifications

## Background
In modern SaaS applications, notification systems need to process webhook events from external platforms and distribute relevant notifications to users. In this task, you will build a Node.js Express application that serves as a GitHub webhook receiver. When a new issue is opened in a GitHub repository, your server will verify the webhook signature and trigger a real-time MagicBell notification broadcast using the official `magicbell-js` SDK.

## Requirements
- Create a Node.js application using Express that listens on port `3000` (or the `PORT` environment variable).
- Implement a POST endpoint `/webhooks/github` to receive webhook events from GitHub.
- **Webhook Signature Verification**:
  - Verify the authenticity of incoming GitHub webhook payloads using the secret key provided in the `GITHUB_WEBHOOK_SECRET` environment variable.
  - The signature is passed in the `x-hub-signature-256` request header in the format `sha256=<signature_hash>`.
  - Compute the HMAC-SHA256 hash of the **raw request body** using the webhook secret, and compare it to the signature from the header.
  - If the signature is missing or invalid, reject the request with HTTP status `401 Unauthorized`.
- **Event Handling**:
  - When a valid `issues` event with action `opened` is received (i.e. `action` is `"opened"` in the JSON body):
    1. Parse the issue title (`issue.title`) and HTML URL (`issue.html_url`).
    2. Initialize the MagicBell `ProjectClient` using the `magicbell-js/project-client` module with the token from the `MAGICBELL_PROJECT_TOKEN` environment variable.
    3. Trigger a MagicBell broadcast with the following details:
       - **Title**: `New GitHub Issue: <issue_title> (Run ID: <run_id>)` where `<run_id>` is read from the `ZEALT_RUN_ID` environment variable.
       - **Content**: `An issue has been opened: <issue_html_url>`
       - **Recipients**: A single recipient with the email set to the value of the `MAGICBELL_EMAIL` environment variable.
    4. Return HTTP status `200 OK` or `201 Created` with a JSON response containing the broadcast details or a success message.
  - For any other webhook events or actions (e.g. `issues` closed, `ping` events, etc.), return HTTP status `200 OK` with a message indicating that the event was skipped.
- Provide a start command `npm start` to run the server.

## Implementation Hints
- Use the `crypto` built-in Node.js module to compute the HMAC-SHA256 signature.
- To compute the HMAC signature correctly, you must access the **raw** request body before it is parsed into JSON. In Express, you can configure standard body-parser middleware to capture the raw body (e.g. using `express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })` or `express.raw({ type: 'application/json' })`).
- Use the official `magicbell-js` package to interact with the MagicBell API. Initialize the admin project client as follows:
  ```javascript
  import { Client } from 'magicbell-js/project-client';
  const client = new Client({ token: process.env.MAGICBELL_PROJECT_TOKEN });
  ```
- Ensure you read the `ZEALT_RUN_ID` environment variable at runtime and include it in the broadcast title exactly as specified: `New GitHub Issue: <issue_title> (Run ID: <run_id>)`.

## Acceptance Criteria
- Project path: `/home/user/myproject`
- Start command: `npm start`
- Port: `3000`
- API Endpoints:
  - POST `/webhooks/github`:
    - Rejects requests with missing or invalid `x-hub-signature-256` headers with HTTP status `401 Unauthorized`.
    - Accepts valid GitHub `issues` events and triggers a real MagicBell broadcast to the recipient specified by the `MAGICBELL_EMAIL` environment variable.
    - Returns HTTP status `200` or `201` for successfully processed or skipped events.
- Integration: Triggers a real MagicBell broadcast for the `issues.opened` event. The broadcast title must contain the issue title and the run-id in the format: `New GitHub Issue: <issue_title> (Run ID: <run_id>)`.

