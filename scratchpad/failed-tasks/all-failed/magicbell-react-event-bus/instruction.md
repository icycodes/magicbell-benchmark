# Listen to Real-Time Events in React

## Background
MagicBell provides real-time event synchronization across its components. Using the headless React SDK, you can hook into MagicBell's core event bus to execute custom logic when notifications are received, read, or deleted. In this task, you will create a simple React application that listens for new notifications and records them in a list.

## Requirements
- Initialize a React application using Vite or Create React App in `/home/user/myproject`.
- Implement a component that wraps the application with the MagicBell context provider using the provided `MAGICBELL_USER_JWT`.
- Use the event bus hook (e.g., `useMagicBellEvent` from `@magicbell/react-headless` or similar) to listen for the `notifications.new` event.
- When a new notification is received, append its title to a list displayed on the screen.
- The list items should have a specific data attribute `data-testid="notification-item"` so they can be easily verified.

## Implementation Hints
- You will need a User JWT. You can generate one on your backend or write a script to generate it for a test user using `MAGICBELL_API_KEY` and `MAGICBELL_SECRET_KEY`.
- Install `@magicbell/react` or `@magicbell/react-headless` as needed.
- Wrap your application in the MagicBell `Provider`.
- Use the `useMagicBellEvent` hook to listen to `notifications.new` events.
- Store the received notifications in a React state array and render them as list items.

## Acceptance Criteria
- Project path: /home/user/myproject
- Start command: npm run dev
- Port: 5173
- Browser verification:
  - Navigate to http://localhost:5173.
  - The page should render without errors.
  - When a new broadcast is sent to the user via the MagicBell API or CLI, the React application must catch the `notifications.new` event in real-time.
  - The title of the new notification must be appended to the DOM as an element with `data-testid="notification-item"`.

