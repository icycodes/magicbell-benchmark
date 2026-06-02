package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"

	// Project Client imports
	projectclient "github.com/magicbell/magicbell-go/pkg/project-client/client"
	projectclientconfig "github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	projectutil "github.com/magicbell/magicbell-go/pkg/project-client/util"
	"github.com/magicbell/magicbell-go/pkg/project-client/broadcasts"

	// User Client imports
	userclient "github.com/magicbell/magicbell-go/pkg/user-client/client"
	userclientconfig "github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/user-client/notifications"
)

func main() {
	log.Println("Starting MagicBell Demo...")

	// 1. Read environment variables
	runID := os.Getenv("ZEALT_RUN_ID")
	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	apiKey := os.Getenv("MAGICBELL_API_KEY")
	secretKey := os.Getenv("MAGICBELL_SECRET_KEY")

	if runID == "" || magicbellEmail == "" || projectToken == "" || apiKey == "" || secretKey == "" {
		log.Fatalf("Missing required environment variables. Ensure ZEALT_RUN_ID, MAGICBELL_EMAIL, MAGICBELL_PROJECT_TOKEN, MAGICBELL_API_KEY, and MAGICBELL_SECRET_KEY are set.")
	}

	// 2. Compute recipient email and external ID
	parts := strings.SplitN(magicbellEmail, "@", 2)
	if len(parts) != 2 {
		log.Fatalf("Invalid MAGICBELL_EMAIL format: %s", magicbellEmail)
	}
	local := parts[0]
	domain := parts[1]
	email := fmt.Sprintf("%s+mark-read-go-%s@%s", local, runID, domain)
	externalID := fmt.Sprintf("user-mark-read-go-%s", runID)
	broadcastTitle := fmt.Sprintf("Mark Read Go Demo - %s", runID)

	log.Printf("Recipient Email: %s", email)
	log.Printf("Recipient External ID: %s", externalID)
	log.Printf("Broadcast Title: %s", broadcastTitle)

	// 3. Initialize Project Client
	pConfig := projectclientconfig.NewConfig()
	pConfig.SetAccessToken(projectToken)
	pClient := projectclient.NewClient(pConfig)

	// 4. Upsert recipient user
	emailNullable := projectutil.Nullable[string]{Value: email, IsNull: false}
	externalIDNullable := projectutil.Nullable[string]{Value: externalID, IsNull: false}

	userToUpsert := shared.User{
		Email:      &emailNullable,
		ExternalId: &externalIDNullable,
	}

	log.Println("Upserting recipient user...")
	upsertResp, upsertErr := pClient.Users.SaveUser(context.Background(), userToUpsert)
	if upsertErr != nil {
		log.Fatalf("Failed to upsert user: %v", upsertErr)
	}
	log.Printf("Successfully upserted user: %+v", upsertResp.Data)

	// 5. Create broadcast
	recipients := []shared.User{
		{
			Email:      &emailNullable,
			ExternalId: &externalIDNullable,
		},
	}

	broadcastData := broadcasts.Broadcast{
		Title:      projectutil.ToPointer(broadcastTitle),
		Recipients: &projectutil.Nullable[[]shared.User]{Value: recipients, IsNull: false},
	}

	log.Println("Creating broadcast...")
	broadcastResp, broadcastErr := pClient.Broadcasts.CreateBroadcast(context.Background(), broadcastData)
	if broadcastErr != nil {
		log.Fatalf("Failed to create broadcast: %v", broadcastErr)
	}
	log.Printf("Successfully created broadcast: %+v", broadcastResp.Data)

	// 6. Mint User JWT
	log.Println("Minting User JWT...")
	claims := jwt.MapClaims{
		"user_email":       email,
		"user_external_id": externalID,
		"api_key":          apiKey,
		"exp":              time.Now().Add(365 * 24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	jwtToken, err := token.SignedString([]byte(secretKey))
	if err != nil {
		log.Fatalf("Failed to sign User JWT: %v", err)
	}
	log.Println("Successfully minted User JWT.")

	// 7. Initialize User Client
	uConfig := userclientconfig.NewConfig()
	uConfig.SetAccessToken(jwtToken)
	uClient := userclient.NewClient(uConfig)

	// 8. Poll user's notifications to locate the broadcast notification
	log.Println("Polling for the broadcast notification...")
	var matchedNotificationID string
	startTime := time.Now()
	for {
		if time.Since(startTime) > 60*time.Second {
			log.Fatalf("Timed out waiting for notification with title: %s", broadcastTitle)
		}

		params := notifications.ListNotificationsRequestParams{}
		resp, err := uClient.Notifications.ListNotifications(context.Background(), params)
		if err != nil {
			log.Printf("Error listing notifications: %v. Retrying in 2 seconds...", err)
			time.Sleep(2 * time.Second)
			continue
		}

		found := false
		for _, n := range resp.Data.Data {
			if n.Title != nil && *n.Title == broadcastTitle {
				if n.Id != nil {
					matchedNotificationID = *n.Id
					found = true
					break
				}
			}
		}

		if found {
			break
		}

		log.Println("Notification not found yet. Retrying in 2 seconds...")
		time.Sleep(2 * time.Second)
	}

	log.Printf("Found matched notification with ID: %s", matchedNotificationID)

	// 9. Mark the notification as read via the Go SDK
	log.Println("Marking notification as read...")
	_, markErr := uClient.Notifications.MarkNotificationRead(context.Background(), matchedNotificationID)
	if markErr != nil {
		log.Fatalf("Failed to mark notification as read: %v", markErr)
	}
	log.Println("Successfully marked notification as read.")

	// 10. Write notification ID to log file
	logPath := "/home/user/myproject/output.log"
	logContent := fmt.Sprintf("Notification ID: %s\n", matchedNotificationID)
	err = os.WriteFile(logPath, []byte(logContent), 0644)
	if err != nil {
		log.Fatalf("Failed to write output.log: %v", err)
	}
	log.Printf("Successfully wrote notification ID to %s", logPath)
}
