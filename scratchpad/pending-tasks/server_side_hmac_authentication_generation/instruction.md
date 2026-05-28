To securely authenticate users and prevent impersonation, MagicBell requires an HMAC signature of the user's email generated on the backend.

You need to create a Node.js utility function `generateUserHmac(userEmail, apiSecret)` that computes the required security hash for a given user.

**Constraints:**
- Must use Node.js's native `crypto` module.
- Must use the SHA256 hashing algorithm.
- The final returned output MUST be a Base64 encoded string.