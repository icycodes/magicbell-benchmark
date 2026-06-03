package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/magicbell/magicbell-go/pkg/user-client/client"
	"github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/user-client/shared"
)

func main() {
	// 1. Read environment variables
	runID := os.Getenv("ZEALT_RUN_ID")
	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	apiKey := os.Getenv("MAGICBELL_API_KEY")
	secretKey := os.Getenv("MAGICBELL_SECRET_KEY")

	if runID == "" || magicbellEmail == "" || apiKey == "" || secretKey == "" {
		log.Fatalf("Missing required environment variables. ZEALT_RUN_ID=%q, MAGICBELL_EMAIL=%q, MAGICBELL_API_KEY=%q, MAGICBELL_SECRET_KEY=%q",
			runID, magicbellEmail, apiKey, secretKey)
	}

	// 2. Format user email and external ID
	// If magicbellEmail is REDACTED@gmail.com, we want to construct the email correctly.
	// Let's strip any existing domain if it's there, or just use the local part.
	localPart := magicbellEmail
	if idx := strings.Index(magicbellEmail, "@"); idx != -1 {
		localPart = magicbellEmail[:idx]
	}
	userEmail := fmt.Sprintf("%s+%s@gmail.com", localPart, runID)
	userExternalID := fmt.Sprintf("user_%s", runID)

	fmt.Printf("User Email: %s\n", userEmail)
	fmt.Printf("User External ID: %s\n", userExternalID)

	// 3. Generate User JWT
	claims := jwt.MapClaims{
		"user_email":       userEmail,
		"user_external_id": userExternalID,
		"api_key":          apiKey,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	userJWT, err := token.SignedString([]byte(secretKey))
	if err != nil {
		log.Fatalf("Failed to generate User JWT: %v", err)
	}
	fmt.Println("Successfully generated User JWT")

	// 4. Initialize MagicBell Go SDK user-client
	config := clientconfig.NewConfig()
	config.SetAccessToken(userJWT)
	sdk := client.NewClient(config)

	// 5. Register Web Push Token
	tokenName := fmt.Sprintf("web_push_token_%s", runID)
	endpointURL := fmt.Sprintf("https://example.com/%s", tokenName)

	// Let's configure the web push token payload.
	// Since endpoint is a *string, and Keys is a *shared.WebPushTokenPayloadKeys containing *strings for Auth and P256dh:
	authStr := "authSecretString12345"
	p256dhStr := "p256dhPublicKeyString12345p256dhPublicKeyString12345p256dhPublicKeyString12345"

	payload := shared.WebPushTokenPayload{
		Endpoint: &endpointURL,
		Keys: &shared.WebPushTokenPayloadKeys{
			Auth:   &authStr,
			P256dh: &p256dhStr,
		},
	}

	ctx := context.Background()
	resp, clientErr := sdk.Channels.SaveWebPushToken(ctx, payload)
	if clientErr != nil {
		log.Fatalf("Failed to register web push token: %v (details: %s)", clientErr, string(clientErr.Body))
	}

	fmt.Printf("API Response: %+v\n", resp)

	// 6. Save success message to log file
	logDir := "/home/user/magicbell-go-device-tokens"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		log.Fatalf("Failed to create log directory: %v", err)
	}

	logFilePath := filepath.Join(logDir, "output.log")
	successMessage := fmt.Sprintf("Successfully registered web push token: %s\n", tokenName)

	err = os.WriteFile(logFilePath, []byte(successMessage), 0644)
	if err != nil {
		log.Fatalf("Failed to write to log file: %v", err)
	}

	fmt.Printf("Log file written successfully to %s\n", logFilePath)
}
