package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/magicbell/magicbell-go/pkg/user-client/client"
	"github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/user-client/notifications"
)

// generateJWT creates a HS256-signed JWT token for MagicBell user authentication.
func generateJWT(secretKey, userEmail, apiKey string) (string, error) {
	// Header
	header := map[string]string{
		"alg": "HS256",
		"typ": "JWT",
	}
	headerJSON, err := json.Marshal(header)
	if err != nil {
		return "", fmt.Errorf("failed to marshal header: %w", err)
	}
	headerEncoded := base64.RawURLEncoding.EncodeToString(headerJSON)

	// Payload
	payload := map[string]string{
		"user_email": userEmail,
		"api_key":    apiKey,
	}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal payload: %w", err)
	}
	payloadEncoded := base64.RawURLEncoding.EncodeToString(payloadJSON)

	// Signing input
	signingInput := headerEncoded + "." + payloadEncoded

	// Signature using HMAC-SHA256
	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write([]byte(signingInput))
	signature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	return signingInput + "." + signature, nil
}

func main() {
	// Read environment variables
	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	zealtRunID := os.Getenv("ZEALT_RUN_ID")
	apiKey := os.Getenv("MAGICBELL_API_KEY")
	secretKey := os.Getenv("MAGICBELL_SECRET_KEY")

	if magicbellEmail == "" || zealtRunID == "" || apiKey == "" || secretKey == "" {
		log.Fatal("Missing required environment variables: MAGICBELL_EMAIL, ZEALT_RUN_ID, MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY")
	}

	// Construct the target user email
	// Strip the @gmail.com part from the base email if present, then reconstruct
	baseEmail := magicbellEmail
	atIdx := strings.Index(magicbellEmail, "@")
	if atIdx != -1 {
		baseEmail = magicbellEmail[:atIdx]
	}
	userEmail := fmt.Sprintf("%s+%s@gmail.com", baseEmail, zealtRunID)

	fmt.Printf("Target user email: %s\n", userEmail)

	// Generate User JWT
	jwt, err := generateJWT(secretKey, userEmail, apiKey)
	if err != nil {
		log.Fatalf("Failed to generate JWT: %v", err)
	}

	// Initialize the MagicBell UserClient with the JWT
	config := clientconfig.NewConfig()
	config.SetAccessToken(jwt)

	userClient := client.NewClient(config)

	// Fetch all notifications by paginating through them
	ctx := context.Background()
	readCount := 0
	unreadCount := 0

	var lastID string
	for {
		params := notifications.ListNotificationsRequestParams{}
		params.SetLimit(50)
		if lastID != "" {
			params.SetStartingAfter(lastID)
		}

		resp, clientErr := userClient.Notifications.ListNotifications(ctx, params)
		if clientErr != nil {
			log.Fatalf("Failed to list notifications: %v", clientErr)
		}

		data := resp.Data.GetData()
		if len(data) == 0 {
			break
		}

		for _, n := range data {
			readAt := n.GetReadAt()
			// A notification is read if ReadAt is not nil, not null, and has a non-empty value
			if readAt != nil && !readAt.IsNull && readAt.Value != "" {
				readCount++
			} else {
				unreadCount++
			}
			if n.GetId() != nil {
				lastID = *n.GetId()
			}
		}

		// If we got fewer than 50 records, we've reached the end
		if len(data) < 50 {
			break
		}
	}

	// Prepare output
	output := fmt.Sprintf("Read: %d\nUnread: %d\n", readCount, unreadCount)
	fmt.Print(output)

	// Write results to log file
	logPath := "/home/user/magicbell-task/output.log"
	if err := os.WriteFile(logPath, []byte(output), 0644); err != nil {
		log.Fatalf("Failed to write output log: %v", err)
	}

	fmt.Printf("Results written to %s\n", logPath)
}
