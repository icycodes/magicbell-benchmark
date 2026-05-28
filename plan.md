# Evaluation Dataset Research: MagicBell

MagicBell is a comprehensive notification-as-a-service platform that allows developers to implement multi-channel notifications (In-app, Email, Mobile Push, Web Push, Slack, SMS) through a single API and a set of pre-built UI components.

### 1. Library Overview

*   **Description**: MagicBell acts as a centralized notification hub. Instead of building separate integrations for email (SendGrid), push (FCM/APNs), and Slack, developers send a single "broadcast" to MagicBell, which handles delivery, user preferences, and real-time synchronization across devices.
*   **Ecosystem Role**: It sits between the application backend and the delivery providers, providing a managed UI (Inbox) and a delivery orchestration engine.
*   **Project Setup**:
    1.  **Dashboard**: Create a project to get an `API Key` and `API Secret`.
    2.  **Frontend (React)**: Install `@magicbell/react`.
    3.  **Backend (Node.js)**: Install `magicbell`.
    4.  **Configuration**: Initialize the provider on the frontend and the project client on the backend.

### 2. Core Primitives & APIs

*   **Broadcast**: The primary entity for sending notifications.
*   **User**: Recipients identified by `email` or `external_id`. Users are created automatically upon the first notification or inbox initialization.
*   **Inbox/FloatingInbox**: Pre-built React components for displaying notifications.
*   **Notification Store**: A client-side state manager (available in headless SDK) for managing unread counts and lists.

#### Code Snippets

**Frontend: Basic Inbox (React)**
```tsx
import Provider from "@magicbell/react/context-provider";
import FloatingInbox from "@magicbell/react/floating-inbox";

function App() {
  return (
    <Provider 
      apiKey="YOUR_API_KEY" 
      userEmail="user@example.com"
      // userHmac="COMPUTED_HMAC_FOR_SECURITY"
    >
      <FloatingInbox />
    </Provider>
  );
}
```
*Docs: [React SDK Guide](https://www.magicbell.com/docs/libraries/magicbell-react)*

**Backend: Sending a Notification (Node.js)**
```javascript
const { ProjectClient } = require('magicbell/project-client');

const magicbell = new ProjectClient({
  apiKey: 'YOUR_API_KEY',
  apiSecret: 'YOUR_API_SECRET',
});

await magicbell.notifications.create({
  title: 'New Comment',
  content: 'Someone replied to your thread.',
  recipients: [{ email: 'user@example.com' }],
  category: 'social', // Used for user preferences
  action_url: 'https://myapp.com/comments/123'
});
```
*Docs: [REST API Reference](https://www.magicbell.com/docs/api/reference)*

**Headless: Custom UI (React)**
```tsx
import { useBell, useNotifications } from '@magicbell/react-headless';

function CustomBell() {
  const { unreadCount, markAllAsRead } = useBell();
  const { notifications } = useNotifications();

  return (
    <div>
      <span>{unreadCount} unread</span>
      <button onClick={markAllAsRead}>Clear all</button>
      <ul>
        {notifications.map(n => <li key={n.id}>{n.title}</li>)}
      </ul>
    </div>
  );
}
```
*Docs: [React Headless SDK](https://www.magicbell.com/docs/libraries/react-headless)*

### 3. Real-World Use Cases & Templates

*   **SaaS Activity Feeds**: Real-time notifications for mentions, assignments, or status changes (e.g., Jira, Slack).
*   **Transactional Alerts**: Password resets or billing alerts that need to fallback to email if the user is offline.
*   **Multi-Channel Sync**: Ensuring that if a user reads a notification in the web app, the mobile push notification and email are marked as read or suppressed.
*   **Integration Example**: [MagicBell + Slack integration guide](https://www.magicbell.com/docs/channels/slack).

### 4. Developer Friction Points

*   **HMAC Authentication**: Implementing the server-side HMAC generation correctly to secure the inbox. Developers often struggle with the specific hashing algorithm (SHA256) and encoding (Base64). [Security Docs](https://www.magicbell.com/docs/rest-api/authentication).
*   **Conditional Delivery**: Configuring "Smart Delivery" rules (e.g., "Send email only if not seen in-app within 5 minutes"). This requires understanding "Categories" and "Delivery Channels".
*   **Topic Subscriptions**: Managing user-defined filters and topics (e.g., "Only notify me about 'High' priority alerts").

### 5. Evaluation Ideas

1.  **Basic Setup**: Integrate the `FloatingInbox` into a React application using a static API key.
2.  **Secure Integration**: Implement HMAC authentication by creating a backend endpoint that signs the user's email.
3.  **Custom UI**: Build a custom notification list using the `@magicbell/react-headless` hooks.
4.  **Event Handling**: Implement a "New Notification" sound or toast using the `useMagicBellEvent` listener.
5.  **Multi-Channel Logic**: Create a broadcast that targets specific user segments using `external_id` and custom attributes.
6.  **Preference Management**: Build a custom settings page where users can toggle notification categories using the SDK.
7.  **Advanced Filtering**: Implement a "Split Inbox" (e.g., "Primary" and "Other" tabs) using custom stores in the React SDK.

### 6. Sources

1.  [Official MagicBell Documentation](https://www.magicbell.com/docs): Primary source for SDKs and API reference.
2.  [MagicBell GitHub Organization](https://github.com/magicbell): Source for `magicbell-js` and React SDK code.
3.  [MagicBell Blog](https://www.magicbell.com/blog): Insights into customization and product updates.
4.  [HMAC Security Guide](https://www.magicbell.com/docs/rest-api/authentication): Details on securing user data.
5.  [Smart Notifications Video](https://www.youtube.com/watch?v=P4gPQjs1bnQ): Overview of delivery logic and rules.