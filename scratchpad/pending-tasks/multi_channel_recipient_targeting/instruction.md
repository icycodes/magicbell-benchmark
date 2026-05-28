MagicBell simplifies user management by automatically creating users based on broadcast recipients, supporting multiple identification methods beyond just email addresses.

You need to write a Node.js broadcast using `ProjectClient` that creates and targets a user based strictly on a unique database ID rather than an email address.

**Constraints:**
- Target a single recipient using the `external_id` set to `"user-987"`.
- Provide a dummy notification title and content.
- Do NOT include an `email` field in the recipient object payload.