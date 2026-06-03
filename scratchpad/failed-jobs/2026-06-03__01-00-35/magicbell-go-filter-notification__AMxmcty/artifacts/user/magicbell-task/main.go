package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/magicbell/magicbell-go/pkg/user-client/client"
	"github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/user-client/notifications"
)

func main() {
	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	zealtRunID := os.Getenv("ZEALT_RUN_ID")
	apiKey := os.Getenv("MAGICBELL_API_KEY")
	secretKey := os.Getenv("MAGICBELL_SECRET_KEY")

	if magicbellEmail == "" || zealtRunID == "" || apiKey == "" || secretKey == "" {
		log.Fatalf("Missing required environment variables")
	}

	// Construct the target user email using subaddressing.
	// If MAGICBELL_EMAIL contains an '@', extract the local part.
	localPart := magicbellEmail
	if idx := strings.Index(magicbellEmail, "@"); idx != -1 {
		localPart = magicbellEmail[:idx]
	}
	targetEmail := fmt.Sprintf("%s+%s@gmail.com", localPart, zealtRunID)
	fmt.Printf("Target Email: %s\n", targetEmail)

	// Generate User JWT
	claims := jwt.MapClaims{
		"user_email": targetEmail,
		"api_key":    apiKey,
		"exp":        time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	userJWT, err := token.SignedString([]byte(secretKey))
	if err != nil {
		log.Fatalf("Failed to sign JWT: %v", err)
	}
	fmt.Printf("Generated User JWT: %s\n", userJWT)

	// Initialize UserClient
	config := clientconfig.NewConfig()
	config.SetAccessToken(userJWT)
	sdk := client.NewClient(config)

	// Fetch notifications
	params := notifications.ListNotificationsRequestParams{}
	params.SetLimit(100)

	resp, clientErr := sdk.Notifications.ListNotifications(context.Background(), params)
	if clientErr != nil {
		log.Fatalf("Failed to list notifications: %v", clientErr)
	}

	if resp == nil {
		log.Fatalf("Received nil response from ListNotifications")
	}

	notificationCollection := resp.GetData()
	notificationsList := notificationCollection.GetData()

	readCount := 0
	unreadCount := 0

	for _, notif := range notificationsList {
		readAt := notif.GetReadAt()
		if readAt != nil && !readAt.IsNull {
			readCount++
		} else {
			unreadCount++
		}
	}

	fmt.Printf("Read: %d, Unread: %d\n", readCount, unreadCount)

	// Write to log file
	outputFile := "/home/user/magicbell-task/output.log"
	content := fmt.Sprintf("Read: %d\nUnread: %d\n", readCount, unreadCount)
	err = os.WriteFile(outputFile, []byte(content), 0644)
	if err != nil {
		log.Fatalf("Failed to write to log file: %v", err)
	}
	fmt.Printf("Successfully wrote results to %s\n", outputFile)
}
