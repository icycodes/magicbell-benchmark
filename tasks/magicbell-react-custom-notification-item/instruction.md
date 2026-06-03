# Custom Notification Item in React

## Background
MagicBell provides a `FloatingInbox` component for React that renders a bell icon and a dropdown list of notifications. By default, it uses a standard notification item layout. For this task, you will customize the rendering of individual notifications within the `FloatingInbox` to match specific UI requirements.

## Requirements
- Create a full-stack project with a React frontend and an Express backend.
- The backend must serve a `GET /token` endpoint that returns a User JWT for a user with external ID `user-${ZEALT_RUN_ID}` and email derived from `MAGICBELL_EMAIL` (using the plus format: `<email_prefix>+${ZEALT_RUN_ID}@<email_domain>`).
- On startup, the backend must upsert this user and send a broadcast notification to them with the title `Test Notification ${ZEALT_RUN_ID}` and content `This is a test`.
- The frontend must render the `@magicbell/react` `FloatingInbox`.
- You must provide a custom notification item component to the `FloatingInbox`.
- The custom notification item must have a wrapper element with the CSS class `custom-notification-item`.
- The custom item must render the notification title inside an element with the class `custom-notification-title`.
- The custom item must render the notification content inside an element with the class `custom-notification-content`.
- If the notification is unread, the custom item must render a button with the class `custom-mark-read-btn`. Clicking this button must mark the notification as read in MagicBell.

## Implementation Hints
- Read the `ZEALT_RUN_ID` and `MAGICBELL_EMAIL` environment variables.
- Use `magicbell-js/project-client` on the backend to upsert the user and send the seed broadcast.
- Use `jsonwebtoken` to generate the User JWT on the backend, signed with `MAGICBELL_SECRET_KEY`.
- In the React frontend, use `Provider` and `FloatingInbox` from `@magicbell/react`.
- `FloatingInbox` (or `Inbox`) typically accepts a prop like `ItemComponent` or `components={{ NotificationItem }}` to override the default item rendering.
- You can use the provided notification data to check its read status and display the mark-as-read button conditionally.
- To mark a notification as read, you can use the methods available on the notification object or the React SDK hooks.
- Run the frontend and backend concurrently using a tool like `concurrently`.

## Acceptance Criteria
- Project path: `/home/user/myproject`
- Start command: `npm start`
- Port: 3000 (frontend) and 3001 (backend)
- The page at `http://localhost:3000` renders the `FloatingInbox`.
- Opening the inbox reveals the notification with the title `Test Notification ${ZEALT_RUN_ID}`.
- The notification is rendered using the custom component with the class `custom-notification-item`.
- The title and content are rendered within elements having classes `custom-notification-title` and `custom-notification-content` respectively.
- The unread notification contains a button with the class `custom-mark-read-btn`.
- Clicking the `custom-mark-read-btn` marks the notification as read, and the button should disappear or the state should update accordingly.

