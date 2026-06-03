# MagicBell React Custom Tabs & Badge Count

## Background
You are building a React application that integrates MagicBell for in-app notifications. You need to display a `FloatingInbox` with custom tabs. However, when custom tabs are added, the global unread badge count often disappears if not configured properly. Your task is to implement the custom tabs correctly so that the badge count remains functional.

## Requirements
- Create a full-stack application (e.g., Next.js or Express + React) that serves a frontend on port 3000.
- The application must authenticate with MagicBell using the credentials provided in the environment variables: `MAGICBELL_API_KEY`, `MAGICBELL_SECRET_KEY`, and `MAGICBELL_PROJECT_TOKEN`.
- The frontend must render a MagicBell `FloatingInbox` component.
- The inbox must be configured with at least two custom tabs (e.g., "All" and "Unread").
- The unread badge count MUST be visible on the bell icon trigger.
- The user email must be constructed by inserting `+${run-id}` before the `@` symbol in the `MAGICBELL_EMAIL` environment variable, where `run-id` is read from `ZEALT_RUN_ID`.
- The backend must provide an endpoint `POST /api/broadcast` that triggers a MagicBell broadcast to this specific user email. This ensures the user has an unread notification so the badge count can be verified.
- The backend must generate a valid User JWT for this user email and provide it to the frontend to initialize the `@magicbell/react` provider.

## Implementation Hints
- Read the current `run-id` from the `ZEALT_RUN_ID` environment variable.
- Construct the user email: if `MAGICBELL_EMAIL` is `test@example.com`, the resulting email should be `test+${run-id}@example.com`.
- Use the `magicbell-js` project client on the backend to send the broadcast in the `POST /api/broadcast` endpoint.
- Generate the User JWT on the backend using `jsonwebtoken` and the `MAGICBELL_SECRET_KEY`.
- In the React frontend, use `@magicbell/react`. Ensure you import the necessary CSS styles.
- To fix the missing badge count issue when using custom tabs, you need to properly configure the `storeId` property for one of your tabs to link it to the global unread count.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: npm start
- Port: 3000
- API Endpoints:
  - `POST /api/broadcast`: Sends a broadcast notification to the `run-id` specific user email. Returns status 200 on success.
- UI Routes:
  - `GET /`: Serves the React frontend. The page must render the MagicBell `FloatingInbox` bell icon.
  - The `FloatingInbox` must have custom tabs configured.
  - After a broadcast is sent, the unread badge count indicator must be visible on the bell icon in the UI.

