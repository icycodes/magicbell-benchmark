package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	userclient "github.com/magicbell/magicbell-go/pkg/user-client/client"
	"github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/user-client/notifications"
)

func main() {
	// Read environment variables
	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	zealtRunID := os.Getenv("ZEALT_RUN_ID")
	magicbellAPIKey := os.Getenv("MAGICBELL_API_KEY")
	magicbellSecretKey := os.Getenv("MAGICBELL_SECRET_KEY")

	if magicbellEmail == "" || zealtRunID == "" || magicbellAPIKey == "" || magicbellSecretKey == "" {
		log.Fatal("Missing required environment variables: MAGICBELL_EMAIL, ZEALT_RUN_ID, MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY")
	}

	// Construct the target user email in the format: ${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com
	// If MAGICBELL_EMAIL contains an @ sign, extract the local part to avoid double domain
	localPart := magicbellEmail
	if atIdx := strings.Index(magicbellEmail, "@"); atIdx != -1 {
		localPart = magicbellEmail[:atIdx]
	}
	userEmail := fmt.Sprintf("%s+%s@gmail.com", localPart, zealtRunID)

	// Generate a User JWT signed with the HS256 algorithm
	// The payload includes user_email and api_key
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_email": userEmail,
		"api_key":    magicbellAPIKey,
	})

	tokenString, err := token.SignedString([]byte(magicbellSecretKey))
	if err != nil {
		log.Fatalf("Failed to sign JWT: %v", err)
	}

	// Initialize the MagicBell Go SDK UserClient with the generated User JWT
	config := clientconfig.NewConfig()
	config.SetAccessToken(tokenString)

	client := userclient.NewClient(config)

	// Fetch notifications using the UserClient
	params := notifications.ListNotificationsRequestParams{}
	response, clientErr := client.Notifications.ListNotifications(context.Background(), params)
	if clientErr != nil {
		log.Fatalf("Failed to list notifications: %v - %s", clientErr.Err, string(clientErr.Body))
	}

	// Count read and unread notifications
	notificationCollection := response.Data
	readCount := 0
	unreadCount := 0

	for _, notification := range notificationCollection.Data {
		readAt := notification.GetReadAt()
		if readAt != nil && !readAt.IsNull && readAt.Value != "" {
			readCount++
		} else {
			unreadCount++
		}
	}

	// Write the results to the log file
	outputDir := "/home/user/magicbell-task"
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		log.Fatalf("Failed to create output directory: %v", err)
	}

	outputPath := outputDir + "/output.log"
	output := fmt.Sprintf("Read: %d\nUnread: %d\n", readCount, unreadCount)

	if err := os.WriteFile(outputPath, []byte(output), 0644); err != nil {
		log.Fatalf("Failed to write output file: %v", err)
	}

	fmt.Printf("Results written to %s\n%s", outputPath, output)
}
