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
	emailBase := os.Getenv("MAGICBELL_EMAIL")
	runID := os.Getenv("ZEALT_RUN_ID")
	apiKey := os.Getenv("MAGICBELL_API_KEY")
	secretKey := os.Getenv("MAGICBELL_SECRET_KEY")

	if emailBase == "" || runID == "" || apiKey == "" || secretKey == "" {
		log.Fatal("Missing required environment variables")
	}

	// In case MAGICBELL_EMAIL already contains @gmail.com, we strip it to form a valid email.
	// But we still construct it in the required format.
	cleanEmailBase := strings.TrimSuffix(emailBase, "@gmail.com")
	
	// The requirement: exactly ${MAGICBELL_EMAIL}+${ZEALT_RUN_ID}@gmail.com
	// If the test provides MAGICBELL_EMAIL without @gmail.com, this is exactly it.
	userEmail := fmt.Sprintf("%s+%s@gmail.com", cleanEmailBase, runID)

	// Generate User JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_email": userEmail,
		"api_key":    apiKey,
		"exp":        time.Now().Add(time.Hour * 24).Unix(),
		"iat":        time.Now().Unix(),
	})

	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		log.Fatalf("Failed to sign token: %v", err)
	}

	// Initialize UserClient
	config := clientconfig.NewConfig()
	config.SetAccessToken(tokenString)

	userClient := client.NewClient(config)

	// Fetch notifications
	params := notifications.ListNotificationsRequestParams{}
	res, clientErr := userClient.Notifications.ListNotifications(context.Background(), params)
	if clientErr != nil {
		log.Fatalf("Failed to list notifications: %v, Body: %s", clientErr.Error(), string(clientErr.Body))
	}

	readCount := 0
	unreadCount := 0

	for _, notif := range res.Data.GetData() {
		if notif.ReadAt != nil && !notif.ReadAt.IsNull {
			readCount++
		} else {
			unreadCount++
		}
	}

	output := fmt.Sprintf("Read: %d\nUnread: %d\n", readCount, unreadCount)

	err = os.WriteFile("/home/user/magicbell-task/output.log", []byte(output), 0644)
	if err != nil {
		log.Fatalf("Failed to write output: %v", err)
	}
}
