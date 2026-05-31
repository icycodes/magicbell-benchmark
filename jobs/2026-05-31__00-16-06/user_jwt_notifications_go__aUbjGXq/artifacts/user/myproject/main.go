package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	projectclient "github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/broadcasts"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	projectutil "github.com/magicbell/magicbell-go/pkg/project-client/util"
	userclient "github.com/magicbell/magicbell-go/pkg/user-client/client"
	userclientconfig "github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/user-client/notifications"
)

func main() {
	// Read environment variables
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	apiKey := os.Getenv("MAGICBELL_API_KEY")
	secretKey := os.Getenv("MAGICBELL_SECRET_KEY")
	gmailUserName := os.Getenv("GMAIL_USER_NAME")
	zealtRunID := os.Getenv("ZEALT_RUN_ID")

	if projectToken == "" || apiKey == "" || secretKey == "" || gmailUserName == "" || zealtRunID == "" {
		log.Fatal("Missing required environment variables")
	}

	// Construct user email and external ID
	userEmail := fmt.Sprintf("%s+%s@gmail.com", gmailUserName, zealtRunID)
	userExternalID := fmt.Sprintf("user_%s", zealtRunID)
	notificationTitle := fmt.Sprintf("Notification %s", zealtRunID)
	notificationContent := fmt.Sprintf("Hello, this is a test notification for run %s!", zealtRunID)

	// Step 1: Initialize ProjectClient and upsert user
	projectConfig := clientconfig.NewConfig()
	projectConfig.SetAccessToken(projectToken)
	projectClient := projectclient.NewClient(projectConfig)

	userRequest := shared.User{
		Email:      projectutil.ToPointer(projectutil.Nullable[string]{Value: userEmail}),
		ExternalId: projectutil.ToPointer(projectutil.Nullable[string]{Value: userExternalID}),
	}

	_, clientErr := projectClient.Users.SaveUser(context.Background(), userRequest)
	if clientErr != nil {
		log.Fatalf("Failed to upsert user: %v", clientErr)
	}
	fmt.Printf("User upserted: %s (%s)\n", userEmail, userExternalID)

	// Step 2: Send a broadcast notification to the user
	recipientUser := shared.User{
		Email:      projectutil.ToPointer(projectutil.Nullable[string]{Value: userEmail}),
		ExternalId: projectutil.ToPointer(projectutil.Nullable[string]{Value: userExternalID}),
	}

	broadcastRequest := broadcasts.Broadcast{
		Title:   projectutil.ToPointer(notificationTitle),
		Content: projectutil.ToPointer(projectutil.Nullable[string]{Value: notificationContent}),
		Recipients: projectutil.ToPointer(projectutil.Nullable[[]shared.User]{
			Value: []shared.User{recipientUser},
		}),
	}

	_, clientErr = projectClient.Broadcasts.CreateBroadcast(context.Background(), broadcastRequest)
	if clientErr != nil {
		log.Fatalf("Failed to create broadcast: %v", clientErr)
	}
	fmt.Printf("Broadcast created: %s\n", notificationTitle)

	// Step 3: Generate User JWT signed with HS256
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_email":       userEmail,
		"user_external_id": userExternalID,
		"api_key":          apiKey,
	})

	tokenString, signErr := token.SignedString([]byte(secretKey))
	if signErr != nil {
		log.Fatalf("Failed to sign JWT: %v", signErr)
	}
	fmt.Printf("User JWT generated\n")

	// Step 4: Initialize UserClient with the generated User JWT
	userConfig := userclientconfig.NewConfig()
	userConfig.SetAccessToken(tokenString)
	userClient := userclient.NewClient(userConfig)

	// Step 5: Wait a bit for the notification to be processed, then retrieve notifications
	// Retry a few times to ensure the notification is available
	var notifData notifications.NotificationCollection
	found := false
	for i := 0; i < 10; i++ {
		time.Sleep(3 * time.Second)
		resp, clientErr := userClient.Notifications.ListNotifications(context.Background(), notifications.ListNotificationsRequestParams{})
		if clientErr != nil {
			log.Printf("Attempt %d: Failed to list notifications: %v", i+1, clientErr)
			continue
		}
		notifData = resp.Data
		if len(notifData.Data) > 0 {
			found = true
			break
		}
		log.Printf("Attempt %d: No notifications found yet, retrying...", i+1)
	}

	if !found {
		log.Fatal("Failed to retrieve notifications after multiple attempts")
	}

	notificationsCount := len(notifData.Data)
	var latestTitle string
	if notificationsCount > 0 {
		latestTitle = *notifData.Data[0].Title
	}

	// Step 6: Log results to output.log
	logContent := fmt.Sprintf("User JWT: %s\nNotifications Count: %d\nLatest Notification Title: %s\n",
		tokenString, notificationsCount, latestTitle)

	logFilePath := "/home/user/myproject/output.log"
	writeErr := os.WriteFile(logFilePath, []byte(logContent), 0644)
	if writeErr != nil {
		log.Fatalf("Failed to write output log: %v", writeErr)
	}

	fmt.Printf("Results logged to %s\n", logFilePath)
	fmt.Printf("User JWT: %s\n", tokenString)
	fmt.Printf("Notifications Count: %d\n", notificationsCount)
	fmt.Printf("Latest Notification Title: %s\n", latestTitle)
}