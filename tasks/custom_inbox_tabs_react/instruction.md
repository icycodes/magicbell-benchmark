# MagicBell Custom Inbox Tabs in React

## Background
In modern SaaS applications, notification inboxes are often categorized into multiple tabs (e.g., Unread, Archived, and All) to help users manage their alerts. MagicBell supports this through custom stores and tabs. However, a common friction point occurs when developers define multiple custom tabs: the global unread/unseen notification badge count (the bell counter) can stop rendering entirely if none of the active stores/tabs are explicitly designated as the `default` store.

## Requirements
Create a React component named `NotificationInboxWithTabs` that implements a custom-tabbed notification inbox using `@magicbell/magicbell-react`.

- The component must be exported as the default export from `src/NotificationInboxWithTabs.jsx`.
- It must accept the following props:
  - `apiKey` (string, required): The MagicBell project's API key.
  - `userEmail` (string, required): The email of the user.
  - `userKey` (string, optional): The user HMAC key for secure authentication.
- It must configure three notification stores with the following criteria:
  - **Unread**: Notifications where `read` is `false`.
  - **Archived**: Notifications where `archived` is `true`.
  - **All**: All notifications (no filters).
- It must render a `FloatingNotificationInbox` with three corresponding tabs:
  - **Unread** tab (linked to the Unread store)
  - **Archived** tab (linked to the Archived store)
  - **All** tab (linked to the All store)
- The global unread badge count (the bell counter) must be displayed correctly. To resolve the badge rendering friction point, you **MUST** explicitly set the `storeId` (and corresponding store `id`) of the **Unread** tab/store to `"default"`.
- Set the `bellCounter` prop on the wrapper component to `"unread"`.
- The `FloatingNotificationInbox` component should have a height of `450`.

## Implementation Hints
- Use the `MagicBell` wrapper component from `@magicbell/magicbell-react` to configure the `apiKey`, `userEmail`, `userKey`, `stores`, and `bellCounter`.
- Define the custom stores array and pass it to the `stores` prop of the `MagicBell` component. Remember that each store definition requires an `id` and `defaultQueryParams`.
- Define the tabs array and pass it to the `tabs` prop of the `FloatingNotificationInbox` component. Each tab object requires a `storeId` and a `label`.
- Use the function-as-a-child pattern with the `MagicBell` component to render the `FloatingNotificationInbox` and pass down the context props (e.g., `{(props) => <FloatingNotificationInbox height={450} tabs={tabs} {...props} />}`).

## Acceptance Criteria
- Project path: /home/user/myproject
- Component file: `src/NotificationInboxWithTabs.jsx`
- The React component must export `NotificationInboxWithTabs` as the default export.
- The component must correctly render `MagicBell` and `FloatingNotificationInbox` with the requested custom stores and tabs configuration.
- One of the stores/tabs (specifically the Unread tab) must be configured with the ID `"default"` to ensure the global unread badge count renders correctly.
- The unread store must filter by `read: false`.
- The archived store must filter by `archived: true`.
- The all store must have no filters.
- The height of `FloatingNotificationInbox` must be set to `450`.
- The `bellCounter` prop on `MagicBell` must be set to `"unread"`.

