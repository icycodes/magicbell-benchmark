# MagicBell React Inbox with Customized Dimensions

## Background
MagicBell provides a complete, real-time notification inbox and multi-channel delivery platform. The `@magicbell/react` package allows developers to easily embed an in-app notification inbox in their React applications. You need to implement a full-stack application that renders this inbox with customized dimensions for a specific test user.

## Requirements
- Create a React frontend (e.g., using Vite) and a small Node.js backend (e.g., using Express) in the same project.
- The backend must provide an endpoint to generate a User JWT for a test user.
- The backend must bootstrap the MagicBell state on startup by upserting the test user and sending a seed broadcast notification to them, ensuring the inbox is not empty.
- The test user's email must be derived from the `MAGICBELL_EMAIL` environment variable in the plus format: `<local>+react-inbox-${run-id}@<domain>` (where `run-id` is read from `ZEALT_RUN_ID`). The user's external ID should be `react-inbox-${run-id}`.
- The frontend must fetch the User JWT from the backend and use it to render a MagicBell `FloatingInbox` using the `@magicbell/react` package.
- The `FloatingInbox` must be customized with the following dimensions: `height={500}` and `width={400}`.

## Implementation Hints
1. Read `ZEALT_RUN_ID` and `MAGICBELL_EMAIL` from the environment to construct the test user's email and external ID.
2. In the backend, use `jsonwebtoken` (HS256) and `MAGICBELL_SECRET_KEY` to sign the User JWT. The payload must include `user_email`, `user_external_id`, and `api_key` (from `MAGICBELL_API_KEY`).
3. Use `magicbell-js` in the backend (with `MAGICBELL_PROJECT_TOKEN`) to upsert the user and create a broadcast notification for them on startup.
4. In the frontend, wrap your app with the MagicBell `Provider` and render the `FloatingInbox` with the requested `height` and `width` properties.
5. Configure your project to start both the frontend and backend concurrently via `npm start`.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: npm start
- Port: 3000 (frontend) and 3001 (backend)
- API Endpoints:
  - GET `http://localhost:3001/token`: Returns a JSON object containing the signed `token`.
- Frontend:
  - The web app at `http://localhost:3000` must render the MagicBell `FloatingInbox`.
  - The inbox component must have its `height` configured to 500 and `width` configured to 400.
  - The inbox must successfully authenticate and display the seed notification sent by the backend.

