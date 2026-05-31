# Fix Event Bubble-Up in Custom Filtered Inbox Tabs

## Background
You are building a custom in-app notification inbox using `@magicbell/react`. To organize notifications, you have implemented a custom tab filtered to show only unread notifications (`read: false`). Each notification item in the list has a custom "three-dots" action menu button that allows users to perform actions on that notification (e.g., archive, delete).

## Requirements
- Create/update a React application located at `/home/user/myproject`.
- Implement a custom notification inbox tab filtered to show only unread notifications (`read: false`).
- Each notification item in the list must render a custom "three-dots" action menu button (with CSS class `three-dots-menu-btn`).
- Fix the event bubble-up/propagation issue: clicking the "three-dots" action menu button must NOT trigger the parent notification item's click handler (which marks the notification as read), allowing the action menu to open successfully without the notification immediately disappearing from the unread tab.
- Clicking elsewhere on the notification item (outside the three-dots button) should still trigger the click handler to mark the notification as read and cause it to disappear from the unread tab.
- The React application must read the User JWT from the `token` query parameter of the URL (e.g., `http://localhost:3000/?token=<JWT>`) and use it as the token for the MagicBell `<Provider>` component.
- Read the `run-id` from the `ZEALT_RUN_ID` environment variable to scope user identifiers and notification content to prevent conflicts.

## Implementation Hints
- Use React's event propagation mechanism to prevent events from bubbling up to parent components.
- Call `event.stopPropagation()` inside the three-dots button's click event handler.
- Ensure the test user external ID is `user_<run-id>` and the notification title contains `<run-id>`.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: npm run dev
- Port: 3000
- Route: /?token=<JWT>
- The UI must render a custom inbox with a tab filtered to show unread notifications (`read: false`).
- Clicking the "three-dots" action menu button (CSS class `three-dots-menu-btn`) on an unread notification must open/toggle the action menu and must NOT mark the notification as read or cause it to disappear from the unread notifications tab.
- Clicking elsewhere on the notification item (outside the three-dots button) should mark the notification as read and make it disappear from the unread tab.

