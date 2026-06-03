# Broadcast with Custom Email Template

## Background
MagicBell allows you to send broadcasts to multiple channels simultaneously. Sometimes, you need to customize the content for a specific channel. Using the `overrides` property, you can provide channel-specific content (a "custom template") that differs from the default broadcast content.

## Requirements
- Create a Node.js script `index.js` that uses the `magicbell-js` ProjectClient to send a broadcast.
- The broadcast must be sent to the email address `${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com`.
- The broadcast must include a default `title` and `content`.
- The broadcast must include an `overrides` configuration specifically for the `email` channel.
- The email channel override must set the title to `Custom Email Title ${ZEALT_RUN_ID}` and the content to `Custom Email Content ${ZEALT_RUN_ID}`.
- The script must print the created broadcast ID to standard output.

## Implementation Hints
- Read the `MAGICBELL_PROJECT_TOKEN` and `ZEALT_RUN_ID` from the environment variables.
- Instantiate the `Client` from `magicbell-js/project-client`.
- Use `client.broadcasts.createBroadcast` to send the notification.
- In the broadcast payload, use `overrides.channels.email` to specify the custom `title` and `content` for the email delivery.

## Acceptance Criteria
- Project path: /home/user/magicbell-nodejs-custom-template
- Ensure the script is executed and the artifacts exist.
- Log file: /home/user/magicbell-nodejs-custom-template/output.log
- The script must output the broadcast ID in the format: `Broadcast ID: <id>` to the log file.
- An email must be delivered to `${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com` with the subject `Custom Email Title ${ZEALT_RUN_ID}`.

