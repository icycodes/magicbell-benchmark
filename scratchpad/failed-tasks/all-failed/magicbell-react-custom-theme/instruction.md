# MagicBell React Custom Theme Inbox

## Background
Create a React web application that integrates the `@magicbell/react` notification inbox. The app should use a custom-themed FloatingInbox and authenticate users securely via a backend service.

## Requirements
- Create a full-stack application with a React frontend and an Express backend.
- The backend must expose a `GET /token` endpoint that generates and returns a secure MagicBell User JWT for the current user.
- The backend should automatically bootstrap the environment on startup by upserting the user and sending a seed broadcast to ensure the inbox has content.
- The React frontend must fetch the User JWT from the backend and use the `@magicbell/react` `<Provider>` to authenticate.
- Render the `<FloatingInbox>` component on the frontend with customized dimensions.
- Use the current `run-id` to isolate all users and broadcasts.

## Implementation Hints
1. Read `ZEALT_RUN_ID` from the environment.
2. The user's email must be `{MAGICBELL_EMAIL}+${run-id}@gmail.com` (use the `MAGICBELL_EMAIL` env var) and their external ID should be `user-${run-id}`.
3. On backend startup, use the `magicbell-js` ProjectClient to upsert the user and create a broadcast with the title `Welcome to MagicBell ${run-id}`.
4. The backend `GET /token` endpoint should sign a User JWT containing the user's email, external ID, and the project API key, signed with the MagicBell Secret Key using the `HS256` algorithm.
5. In the React frontend, configure the `<FloatingInbox>` with `placement="bottom-end"`, `height={600}`, `width={500}`, and `offset={20}`.
6. Run both the frontend (port 3000) and backend (port 3001) concurrently when `npm start` is executed.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: npm start
- Port: 3000 (Frontend), 3001 (Backend)
- API Endpoints:
  - GET `http://localhost:3001/token`: Returns status 200 and a JSON object `{"token": "<USER_JWT>"}`.
- Frontend:
  - The React app on `http://localhost:3000` must render the MagicBell FloatingInbox.
  - The inbox must be authenticated using the token from the backend.
  - The inbox must display the seed broadcast titled `Welcome to MagicBell <run-id>`.
  - The FloatingInbox must have the custom dimensions applied (height: 600, width: 500).
