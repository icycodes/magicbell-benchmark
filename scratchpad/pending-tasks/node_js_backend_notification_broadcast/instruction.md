The MagicBell Node.js SDK acts as a centralized delivery orchestration engine, allowing backend services to dispatch notifications across multiple channels through a single API.

You need to write a Node.js script using `ProjectClient` to send a "New Comment" notification containing the text "Someone replied to your thread." to `user@example.com`.

**Constraints:**
- Must use the official `magicbell/project-client` module.
- Must categorize the notification under the "social" category.
- Must include an `action_url` pointing to `https://myapp.com/comments/123`.