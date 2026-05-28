Modern applications often trigger side-effects like custom toast alerts or sounds when a new notification arrives in real-time while the user is active.

You need to implement a real-time event listener inside a React component using the MagicBell SDK to capture incoming notifications as they arrive.

**Constraints:**
- Must listen for the incoming notification event and log the notification's `title` property to the console.
- Must use the standard MagicBell event listener hooks/methods provided by the SDK.
- Do not manually modify the global unread count state.