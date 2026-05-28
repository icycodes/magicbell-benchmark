Some applications require completely custom UI designs for their notification centers, relying purely on the state management of the notification store.

You need to build a custom React component `CustomBell` using the `useBell` and `useNotifications` hooks from the headless SDK to display a list of notification titles and the total unread count.

**Constraints:**
- Must import hooks exclusively from `@magicbell/react-headless`.
- Include a "Clear all" button that directly triggers the `markAllAsRead` function.
- Do NOT import or render any pre-built UI components like `FloatingInbox`.