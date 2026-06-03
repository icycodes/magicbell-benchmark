package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	userclient "github.com/magicbell/magicbell-go/pkg/user-client/client"
	"github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/user-client/shared"
)

func main() {
	// Read environment variables
	zealtRunID := os.Getenv("ZEALT_RUN_ID")
	if zealtRunID == "" {
		log.Fatal("ZEALT_RUN_ID environment variable is required")
	}

	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	if magicbellEmail == "" {
		log.Fatal("MAGICBELL_EMAIL environment variable is required")
	}

	apiKey := os.Getenv("MAGICBELL_API_KEY")
	if apiKey == "" {
		log.Fatal("MAGICBELL_API_KEY environment variable is required")
	}

	secretKey := os.Getenv("MAGICBELL_SECRET_KEY")
	if secretKey == "" {
		log.Fatal("MAGICBELL_SECRET_KEY environment variable is required")
	}

	// Build the user-specific email: <local_part>+<ZEALT_RUN_ID>@gmail.com
	atIdx := strings.Index(magicbellEmail, "@")
	if atIdx == -1 {
		log.Fatal("MAGICBELL_EMAIL is not a valid email address")
	}
	localPart := magicbellEmail[:atIdx]
	userEmail := fmt.Sprintf("%s+%s@gmail.com", localPart, zealtRunID)
	userExternalID := fmt.Sprintf("user_%s", zealtRunID)
	webPushTokenName := fmt.Sprintf("web_push_token_%s", zealtRunID)

	// Generate User JWT using HMAC-HS256
	claims := jwt.MapClaims{
		"api_key":          apiKey,
		"user_email":       userEmail,
		"user_external_id": userExternalID,
		"exp":              time.Now().Add(24 * time.Hour).Unix(),
		"iat":              time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(secretKey))
	if err != nil {
		log.Fatalf("Failed to sign JWT: %v", err)
	}

	// Initialize the MagicBell user client with the JWT
	config := clientconfig.NewConfig()
	config.SetAccessToken(signedToken)

	client := userclient.NewClient(config)

	// Build the WebPushTokenPayload
	// The endpoint is a web push subscription URL, named with the token name
	keys := shared.WebPushTokenPayloadKeys{}
	keys.SetAuth("auth_" + zealtRunID)
	keys.SetP256dh("p256dh_" + zealtRunID)

	// Use a valid-looking web push endpoint URL that encodes the token name
	endpoint := fmt.Sprintf("https://fcm.googleapis.com/fcm/send/%s", webPushTokenName)

	payload := shared.WebPushTokenPayload{}
	payload.SetEndpoint(endpoint)
	payload.SetKeys(keys)

	// Register the web push token
	ctx := context.Background()
	resp, clientErr := client.Channels.SaveWebPushToken(ctx, payload)
	if clientErr != nil {
		log.Fatalf("Failed to register web push token: %v", clientErr)
	}

	_ = resp

	// Build success message
	successMessage := fmt.Sprintf("Successfully registered web push token: %s", webPushTokenName)
	fmt.Println(successMessage)

	// Write success message to log file
	logPath := "/home/user/magicbell-go-device-tokens/output.log"
	logFile, err := os.Create(logPath)
	if err != nil {
		log.Fatalf("Failed to create log file: %v", err)
	}
	defer logFile.Close()

	_, err = fmt.Fprintln(logFile, successMessage)
	if err != nil {
		log.Fatalf("Failed to write to log file: %v", err)
	}

	fmt.Printf("Log written to %s\n", logPath)
}
