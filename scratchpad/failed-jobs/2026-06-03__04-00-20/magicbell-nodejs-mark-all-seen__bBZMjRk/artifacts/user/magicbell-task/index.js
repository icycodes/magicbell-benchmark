const jwt = require("jsonwebtoken");
const { Client } = require("magicbell-js/user-client");

// Read environment variables
const MAGICBELL_EMAIL = process.env.MAGICBELL_EMAIL;
const ZEALT_RUN_ID = process.env.ZEALT_RUN_ID;
const MAGICBELL_API_KEY = process.env.MAGICBELL_API_KEY;
const MAGICBELL_SECRET_KEY = process.env.MAGICBELL_SECRET_KEY;

// Validate required environment variables
if (!MAGICBELL_EMAIL || !ZEALT_RUN_ID || !MAGICBELL_API_KEY || !MAGICBELL_SECRET_KEY) {
  console.error(
    "Missing required environment variables: MAGICBELL_EMAIL, ZEALT_RUN_ID, MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY"
  );
  process.exit(1);
}

// Construct the user email in plus format
const userEmail = `${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com`;

// Generate a User JWT signed with HS256
const token = jwt.sign(
  {
    user_email: userEmail,
    api_key: MAGICBELL_API_KEY,
  },
  MAGICBELL_SECRET_KEY,
  {
    algorithm: "HS256",
  }
);

// Initialize the MagicBell UserClient
const client = new Client({ token });

// Mark all notifications as seen
// The SDK does not have a dedicated method for this, so we use fetch directly
async function markAllAsSeen() {
  const baseUrl = "https://api.magicbell.com/v2";
  const response = await fetch(`${baseUrl}/notifications/seen`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  // The endpoint returns 204 No Content on success
  if (response.status !== 204 && response.status !== 200) {
    const body = await response.text();
    throw new Error(`Failed to mark all notifications as seen: ${response.status} - ${body}`);
  }
}

markAllAsSeen()
  .then(() => {
    console.log("All notifications marked as seen successfully.");
  })
  .catch((err) => {
    console.error("Error marking notifications as seen:", err.message);
    process.exit(1);
  });