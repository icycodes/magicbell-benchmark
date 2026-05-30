# MagicBell Integration Research Plan

## 1. Library Overview

* **Description**: MagicBell is a complete, real-time notification inbox and multi-channel delivery platform designed for modern web and mobile applications. It allows developers to send notifications across multiple channels—including an in-app notification inbox, email, mobile push (APNs/FCM), web push, SMS (Twilio), and Slack—using a single, unified API. It handles delivery orchestration, user preferences, read/unread states, and real-time syncing out-of-the-box.
* **Ecosystem Role**: MagicBell acts as the notification dispatch and orchestration layer in your technology stack. Instead of building complex backend queues, subscription managers, and UI components for notifications, developers trigger broadcasts or workflows in MagicBell. MagicBell then routes the messages to the correct channels based on user preferences and preset delivery rules.
* **Project Setup**:
  1. **Create an Account & Project**: Sign up on the [MagicBell Dashboard](https://app.magicbell.com/) and create a new project (e.g., Development, Staging, Production).
  2. **Retrieve API Keys**: Go to the **Settings** page of your project. Navigate to **User Auth** to get your **API Key** (`MAGICBELL_API_KEY`) and **Secret Key** (`MAGICBELL_SECRET_KEY`). Navigate to **Project Auth** to generate a **Project JWT** (`MAGICBELL_PROJECT_TOKEN`).
  3. **Configure Delivery Channels**: In the dashboard, configure your active providers (e.g., SMTP for Email, APNs/FCM for Mobile Push, Web Push, Slack, or Twilio).
  4. **Install MagicBell CLI**:
     ```bash
     npm install -g magicbell-cli
     ```
  5. **Install Backend & Frontend SDKs**:
     * Node.js/Browser: `npm install magicbell-js`
     * Go: `go get github.com/magicbell/magicbell-go`
     * React: `npm install @magicbell/react`

---

## 2. Core Primitives & APIs

### a. Token Scopes & JWT Authentication
MagicBell uses two distinct types of JWT tokens to secure administrative and user-level endpoints.

#### 1. Project JWT (Project Token)
* **Scope**: Project-wide administrative operations. Allows server-to-server operations like managing users, creating broadcasts, managing workflows, and fetching system events.
* **Generation**: Generated manually via the MagicBell Dashboard under **Project Auth → New Token**.
* **Usage Context**: Used exclusively in backend servers, scripts, or CI/CD pipelines. **Never expose this token on the client-side or in the browser.**
* **HTTP Header**: `Authorization: Bearer <PROJECT_JWT>`

#### 2. User JWT (User Token)
* **Scope**: Restricted to a single, specific user's context. Allows reading/mutating user notifications, managing user-specific device tokens, and rendering the in-app notification inbox.
* **Generation**: Generated programmatically on your backend using your project's **Secret Key** and **API Key** signed with the `HS256` algorithm. It should have a reasonable expiration (e.g., `'1y'`).
* **Usage Context**: Safe to send to the client-side/browser to initialize frontend React UIs or User SDK clients.
* **Payload Structure**:
  ```json
  {
    "user_email": "user@example.com",
    "user_external_id": "user_123",
    "api_key": "pk_xxxxxx"
  }
  ```
* **Signing Example (Node.js Backend)**:
  ```javascript
  import jwt from 'jsonwebtoken';

  const userJwt = jwt.sign(
    {
      user_email: 'user@example.com',
      user_external_id: 'user_123',
      api_key: process.env.MAGICBELL_API_KEY,
    },
    process.env.MAGICBELL_SECRET_KEY,
    {
      algorithm: 'HS256',
      expiresIn: '1y'
    }
  );
  ```

---

### b. MagicBell CLI (Project Management)
The MagicBell CLI provides a command-line interface to manage your projects. All examples below are strictly **non-interactive** using manual authentication.

#### 1. Installation & Authentication
Install globally via npm and login non-interactively in CI/CD or scripts:
```bash
# Install CLI
npm install -g magicbell-cli

# Login non-interactively using manual keys
magicbell login   --manual   --email "$ADMIN_EMAIL"   --jwt "$MAGICBELL_PROJECT_TOKEN"   --api-key "$MAGICBELL_API_KEY"   --secret-key "$MAGICBELL_SECRET_KEY"
```

#### 2. Managing Users
```bash
# List all users in the project
magicbell users list

# Fetch details of a specific user by ID
magicbell users get "user_123"

# Update user details
magicbell users update "user_123" --email "new-email@example.com"

# Delete a user by external ID
magicbell users delete-by-external-id "user_123"
```

#### 3. Creating Broadcasts
Broadcasts allow you to fan out a notification to multiple recipients:
```bash
magicbell broadcast create   --data '{"title": "System Maintenance", "content": "We will be down for maintenance tonight.", "recipients": [{"email": "user@example.com"}]}'
```

#### 4. Managing Workflows & Checking Events
Workflows allow orchestrating multi-step notification campaigns:
```bash
# Save / Upsert a workflow definition
magicbell workflow save   --data '{"key": "onboarding-campaign", "steps": [{"command": "broadcast", "input": {"title": "Welcome!", "content": "Thanks for signing up."}}]}'

# List runs for a workflow key
magicbell workflow list_runs --workflow_key "onboarding-campaign"

# Fetch execution details for a specific run ID
magicbell workflow fetch_run --run_id "run_98765"
```

---

### c. MagicBell Browser/Node.js SDK (`magicbell-js`)
The `magicbell-js` package replaces the deprecated `magicbell` package and provides OpenAPI-generated clients for both project administrators and end users.

* **Documentation Link**: [magicbell-js SDK Docs](https://www.magicbell.com/docs/libraries/magicbell-js)

#### 1. ProjectClient (Server-to-Server / Administrative)
```javascript
import { Client } from 'magicbell-js/project-client';

const client = new Client({
  token: process.env.MAGICBELL_PROJECT_TOKEN,
});

(async () => {
  // 1. Managing Users (Save / Upsert)
  const userResponse = await client.users.saveUser({
    externalId: 'user_123',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
  });
  console.log('User saved:', userResponse.data);

  // 2. Creating a Broadcast
  const broadcastResponse = await client.broadcasts.createBroadcast({
    title: 'New Feature Released!',
    content: 'Check out our latest dashboard updates.',
    recipients: [{ externalId: 'user_123' }],
  });
  console.log('Broadcast created ID:', broadcastResponse.data.id);

  // 3. Managing Workflows (Save / Upsert)
  const workflowResponse = await client.workflows.saveWorkflow({
    key: 'new-signups',
    steps: [
      {
        command: 'broadcast',
        input: {
          title: 'Welcome to our platform!',
          content: 'We are excited to have you on board.',
        },
      },
    ],
  });
  console.log('Workflow saved key:', workflowResponse.data.key);

  // 4. Checking Events
  const eventsResponse = await client.events.listEvents({
    limit: 10,
  });
  console.log('Recent events:', eventsResponse.data);
})();
```

#### 2. UserClient (Client-Side / User Context)
```javascript
import { Client } from 'magicbell-js/user-client';

const client = new Client({
  token: 'GENERATED_USER_JWT', // Pass the User JWT generated on your backend
});

(async () => {
  // 1. Managing Notifications (List)
  const notificationsResponse = await client.notifications.listNotifications({
    limit: 10,
  });
  console.log('User Notifications:', notificationsResponse.data);

  // 2. Mark Notification as Read
  await client.notifications.markAsRead('notification_id_here');

  // 3. Archive Notification
  await client.notifications.archiveNotification('notification_id_here');

  // 4. Managing Channels (Save Web Push Token)
  await client.channels.saveWebPushToken({
    web_push: {
      device_token: 'web_push_registration_token_here',
    },
  });
  console.log('Web push token registered.');
})();
```

---

### d. MagicBell Go SDK (`github.com/magicbell/magicbell-go`)
The official Go SDK provides high-performance, strongly-typed wrappers for both Project and User clients.

* **Documentation Link**: [Go SDK Docs](https://www.magicbell.com/docs/libraries/magicbell-go)

#### 1. ProjectClient (Server-to-Server / Administrative)
```go
package main

import (
	"context"
	"fmt"
	"log"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/users"
	"github.com/magicbell/magicbell-go/pkg/project-client/broadcasts"
	"github.com/magicbell/magicbell-go/pkg/project-client/workflows"
	"github.com/magicbell/magicbell-go/pkg/project-client/events"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
)

func main() {
	config := clientconfig.NewConfig()
	config.SetAccessToken("YOUR_PROJECT_JWT")
	sdk := client.NewClient(config)

	ctx := context.Background()

	// 1. Managing Users (Save)
	userReq := users.User{
		ExternalId: util.ToPointer("user_123"),
		Email:      util.ToPointer("user@example.com"),
		FirstName:  util.ToPointer("John"),
		LastName:   util.ToPointer("Doe"),
	}
	userRes, err := sdk.Users.SaveUser(ctx, userReq)
	if err != nil {
		log.Fatalf("Error saving user: %v", err)
	}
	fmt.Printf("Saved User: %s
", *userRes.Data.Email)

	// 2. Creating a Broadcast
	broadcastReq := broadcasts.CreateBroadcastRequest{
		Title: "System Announcement",
		Content: util.ToPointer("Our services are fully operational."),
		Recipients: []broadcasts.Recipient{
			{
				ExternalId: util.ToPointer("user_123"),
			},
		},
	}
	bcRes, err := sdk.Broadcasts.CreateBroadcast(ctx, broadcastReq)
	if err != nil {
		log.Fatalf("Error creating broadcast: %v", err)
	}
	fmt.Printf("Broadcast Created ID: %s
", bcRes.Data.Id)

	// 3. Managing Workflows (Save)
	wfReq := workflows.WorkflowDefinition{
		Key: util.ToPointer("onboarding-campaign"),
		Steps: []workflows.WorkflowDefinitionSteps{
			{
				Command: util.ToPointer("broadcast"),
				Input: map[string]interface{}{
					"title": "Welcome to Go SDK!",
					"content": "Enjoy building applications with MagicBell.",
				},
			},
		},
	}
	wfRes, err := sdk.Workflows.SaveWorkflow(ctx, wfReq)
	if err != nil {
		log.Fatalf("Error saving workflow: %v", err)
	}
	fmt.Printf("Workflow Saved Key: %s
", *wfRes.Data.Key)

	// 4. Checking Events (List)
	eventParams := events.ListEventsRequestParams{
		Limit: util.ToPointer(int64(10)),
	}
	eventRes, err := sdk.Events.ListEvents(ctx, eventParams)
	if err != nil {
		log.Fatalf("Error listing events: %v", err)
	}
	fmt.Printf("Fetched %d events
", len(eventRes.Data))
}
```

#### 2. UserClient (Client-Side / User Context)
```go
package main

import (
	"context"
	"fmt"
	"log"

	"github.com/magicbell/magicbell-go/pkg/user-client/client"
	"github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/user-client/notifications"
	"github.com/magicbell/magicbell-go/pkg/user-client/channels"
	"github.com/magicbell/magicbell-go/pkg/user-client/util"
)

func main() {
	config := clientconfig.NewConfig()
	config.SetAccessToken("YOUR_USER_JWT")
	sdk := client.NewClient(config)

	ctx := context.Background()

	// 1. Managing Notifications (List)
	notifParams := notifications.ListNotificationsRequestParams{
		Limit: util.ToPointer(int64(10)),
	}
	notifRes, err := sdk.Notifications.ListNotifications(ctx, notifParams)
	if err != nil {
		log.Fatalf("Error listing notifications: %v", err)
	}
	fmt.Printf("Found %d notifications
", len(notifRes.Data))

	// 2. Managing Channels (List Inbox Tokens)
	tokenParams := channels.ListInboxTokensRequestParams{
		Limit: util.ToPointer(int64(5)),
	}
	tokenRes, err := sdk.Channels.ListInboxTokens(ctx, tokenParams)
	if err != nil {
		log.Fatalf("Error listing inbox tokens: %v", err)
	}
	fmt.Printf("Found %d inbox tokens
", len(tokenRes.Data))
}
```

---

### e. MagicBell React Components (`@magicbell/react`)
The modern `@magicbell/react` package deprecates the old `@magicbell/magicbell-react` package and provides a context provider and floating inbox components.

* **Documentation Link**: [React Components Docs](https://www.magicbell.com/docs/libraries/magicbell-react)

#### 1. Basic In-App Notification Inbox Implementation
```jsx
import * as React from "react";
import Provider from "@magicbell/react/context-provider";
import FloatingInbox from "@magicbell/react/floating-inbox";

// Import the required CSS styles for the FloatingInbox
import "@magicbell/react/styles/floating-inbox.css";

function App() {
  // Retrieve the User JWT from your backend authentication flow
  const userJwt = "YOUR_USER_JWT_FROM_BACKEND";

  return (
    <Provider token={userJwt}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 2rem",
        background: "#1e1e24",
        color: "#fff"
      }}>
        <div className="logo" style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
          SaaS Dashboard
        </div>
        
        {/* FloatingInbox renders the Bell icon and handles opening/closing the panel */}
        <FloatingInbox 
          placement="bottom-end" 
          height={500} 
          width={400} 
          offset={12} 
        />
      </header>
      
      <main style={{ padding: "2rem" }}>
        <h1>Welcome back to your workspace!</h1>
        <p>Trigger a broadcast to see notifications appear in real-time.</p>
      </main>
    </Provider>
  );
}

export default App;
```

---

## 3. Real-World Use Cases & Templates

### a. Full-Stack Example & Boilerplates
* **React Native Mobile Inbox**: [Mobile Inbox Example](https://github.com/magicbell/mobile-inbox) - A full-blown React Native application demonstrating device token registration for push notifications (APNs and FCM) and real-time syncing.
* **Web Components Integration**: [Web Components Quickstart](https://www.magicbell.com/inbox) - Demonstrates integrating MagicBell into Svelte, Preact, or pure HTML apps using `<mb-context-provider>` and `<mb-floating-inbox>`.

### b. Common Integration Patterns
* **Stripe Webhook Workflows**: [Stripe Webhook Integration](https://www.magicbell.com/workflows/stripe) - Forwarding Stripe webhook events (e.g., `charge.succeeded`) directly to MagicBell workflow URLs to trigger conditional notification steps (e.g., emailing invoices, sending in-app receipts).
* **GitHub Webhook Workflows**: [GitHub Webhook Integration](https://www.magicbell.com/workflows/github) - Connecting GitHub repository events (like `pull_request.opened` or `gollum` wiki updates) to trigger real-time Slack and in-app notifications for developers.

---

## 4. Developer Friction Points

### a. Topic Subscription Recipients Syntax
* **Friction Point**: Developers attempting to broadcast a notification to all subscribers of a specific topic often use intuitive but incorrect recipient formats (e.g., passing raw topic keys directly), resulting in delivery failure.
* **Resolution**: Recipients must be specified with the nested subscribers flag format: `"recipients": [{"topic": {"subscribers": true}}]`.
* **Reference**: [Topic Subscriptions Discussion #213](https://github.com/orgs/magicbell/discussions/213)

### b. Badge Count with Custom Inbox Tabs
* **Friction Point**: When developers configure multiple custom tabs in their React/JavaScript inbox layouts, the unread/unseen notification badge count frequently stops rendering entirely.
* **Resolution**: One of the inbox tabs' `storeId` values must be explicitly set to `"default"` for MagicBell's client state manager to wire up and display the global unread badge correctly.
* **Reference**: [Inbox Tabs Badge Discussion #228](https://github.com/orgs/magicbell/discussions/228)

### c. Event Bubble-Up in Filtered Tabs (Three-Dots Menu)
* **Friction Point**: When displaying notifications in tabs filtered by `read: false`, clicking on the "three-dots" action menu causes the notification to immediately mark as read and disappear from the view before any action (like delete or archive) can be chosen.
* **Resolution**: The click event on the dots menu bubble up and triggers the global notification click handler. Developers must handle event propagation or upgrade to the fixed `magicbell-js` client wrapper (`magicbell/magicbell-js#468`).
* **Reference**: [Filtered Tabs Menu Discussion #231](https://github.com/orgs/magicbell/discussions/231)

---

## 5. Evaluation Ideas

### Simple
1. Trigger a notification broadcast to a single user using the Node.js SDK ProjectClient.
2. Render an in-app notification inbox using `@magicbell/react` with customized dimensions.

### Medium
3. Generate a secure User JWT on a backend server using HMAC-HS256 and verify its format.
4. Programmatically manage workflow definitions (create, fetch, delete) using the Go SDK ProjectClient.
5. Retrieve and filter a user's notifications (read vs unread) using the Go SDK UserClient.

### Complex
6. Listen and react to real-time notification events in a React application using the core event bus.
7. Register and manage user-specific device tokens for Web Push or APNs using the Go SDK UserClient.

---

## 6. Sources

1. [MagicBell Authentication Overview](https://www.magicbell.com/docs/api/authentication) - Official documentation on MagicBell's JWT authentication architecture.
2. [MagicBell User Authentication](https://www.magicbell.com/docs/api/authentication/user) - Details on payload structures and backend generation of User JWTs.
3. [MagicBell Project Authentication](https://www.magicbell.com/docs/api/authentication/project) - Details on obtaining and managing administrative Project JWTs.
4. [MagicBell CLI Documentation](https://www.magicbell.com/docs/libraries/magicbell-cli) - Commands, syntax, and authentication procedures for the CLI.
5. [magicbell-js SDK Repository](https://github.com/magicbell/magicbell-js) - Source code and release notes for the modern JavaScript/TypeScript SDKs.
6. [magicbell-go SDK Documentation](https://www.magicbell.com/docs/libraries/magicbell-go) - Core services, setup, and models for the official Go SDK.
7. [MagicBell React Components Library](https://www.magicbell.com/docs/libraries/magicbell-react) - Integration guides, CSS styles, and properties for the modern `@magicbell/react` package.
8. [MagicBell Workflows Documentation](https://www.magicbell.com/workflows) - Guides on creating and running automated notification workflows.
9. [MagicBell Community Discussions](https://github.com/orgs/magicbell/discussions) - Public discussion board highlighting developer challenges and bug reports.

---

## Integration

The following environment variables will be provided:
* MAGICBELL_PROJECT_TOKEN
* MAGICBELL_API_KEY
* MAGICBELL_SECRET_KEY

**Important note for task generation:**

1. Two channels have been set up for testing: `in_app` and `email`. The project-wide default Delivery Planner configuration is preset so that broadcasts will be sent to these two channels.

2. DO NOT allow the task executor to modify the project-wide Delivery Planner configuration settings. If you need customized delivery logic, create new workflows and trigger them.

3. To set up test users and receive inbound email, refer to the `gmail` integration documentation.
