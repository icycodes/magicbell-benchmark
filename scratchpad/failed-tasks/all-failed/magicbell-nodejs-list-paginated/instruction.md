# List Notifications with Pagination

## Background
Use the `magicbell-js` UserClient to list notifications for a user with pagination.

## Requirements
- Create a Node.js script `list_notifications.js` that uses the `magicbell-js` UserClient to fetch notifications.
- The script should authenticate using a user JWT provided in the `USER_JWT` environment variable.
- Fetch the first page of notifications with a limit of 2.
- Use the ID of the last notification from the first page as the `startingAfter` parameter to fetch the second page of notifications with a limit of 2.
- Print the fetched notification IDs to stdout.

## Implementation Hints
- Initialize the `Client` from `magicbell-js/user-client` using the token from `process.env.USER_JWT`.
- Call `client.notifications.listNotifications({ limit: 2 })` to get the first page.
- Call it again with `{ limit: 2, startingAfter: <last_notification_id> }` to get the second page.
- Print the IDs to stdout.

## Acceptance Criteria
- Project path: /home/user/myproject
- Command: `node list_notifications.js`
- The command takes no arguments, but requires the `USER_JWT` environment variable to be set.
- The stdout should print the IDs from the first page and the second page in exactly the following format:
  ```
  Page 1: <id1>, <id2>
  Page 2: <id3>, <id4>
  ```

