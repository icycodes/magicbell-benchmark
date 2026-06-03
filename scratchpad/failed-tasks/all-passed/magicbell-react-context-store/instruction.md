# MagicBell Custom Badge with Context Provider

## Background
Sometimes developers need to build custom UI components, such as a custom unread badge or counter, without rendering the full MagicBell `Inbox` component. This requires accessing the underlying notification store directly through the React context.

## Requirements
- Create a simple React application using Vite or Create React App.
- Use the MagicBell React SDK (`@magicbell/react` or `@magicbell/react-headless`).
- Wrap the application with the MagicBell `Provider` (or `MagicBellProvider`) using the provided `MAGICBELL_EMAIL` and `MAGICBELL_API_KEY` (or generated User JWT, depending on the SDK version).
- Create a custom component named `CustomBadge` that uses the `useNotifications` hook (or equivalent context hook) to access the notification store directly.
- The `CustomBadge` component must render the exact text `Unread count: X` where `X` is the actual `unreadCount` from the store.
- The application should run on port 3000.

## Implementation Hints
- You can use the `useNotifications` hook from the MagicBell React Headless SDK to get the store.
- Ensure the provider is properly configured with your MagicBell project credentials.
- The `store` object returned by `useNotifications()` contains an `unreadCount` property.
- Wait for the store to be initialized before rendering the count, or handle undefined gracefully.

## Acceptance Criteria
- Project path: /home/user/magicbell-react-context-store
- Start command: npm run dev
- Port: 3000
- The web application must successfully render the text `Unread count: X` (where X is a valid number) on the page.

