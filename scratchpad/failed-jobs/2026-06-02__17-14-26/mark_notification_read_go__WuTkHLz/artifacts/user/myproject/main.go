package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"

	projectclient "github.com/magicbell/magicbell-go/pkg/project-client/client"
	projectclientconfig "github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	projectclientbroadcasts "github.com/magicbell/magicbell-go/pkg/project-client/broadcasts"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	projectutil "github.com/magicbell/magicbell-go/pkg/project-client/util"

	userclient "github.com/magicbell/magicbell-go/pkg/user-client/client"
	userclientconfig "github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	userclientnotifications "github.com/magicbell/magicbell-go/pkg/user-client/notifications"
)

func mintUserJWT(email, externalId, apiKey, secretKey string) (string, error) {
	claims := jwt.MapClaims{
		"user_email":       email,
		"user_external_id": externalId,
		"api_key":          apiKey,
		"exp":              time.Now().Add(time.Hour * 24).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secretKey))
}

func main() {
	runId := os.Getenv("ZEALT_RUN_ID")
	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	apiKey := os.Getenv("MAGICBELL_API_KEY")
	secretKey := os.Getenv("MAGICBELL_SECRET_KEY")

	if runId == "" || magicbellEmail == "" || projectToken == "" || apiKey == "" || secretKey == "" {
		log.Fatal("Missing required env vars")
	}

	parts := strings.Split(magicbellEmail, "@")
	if len(parts) != 2 {
		log.Fatal("Invalid MAGICBELL_EMAIL")
	}
	email := fmt.Sprintf("%s+mark-read-go-%s@%s", parts[0], runId, parts[1])
	externalId := "user-mark-read-go-" + runId

	// 1. ProjectClient to upsert user
	config := projectclientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	pClient := projectclient.NewClient(config)

	user := shared.User{
		ExternalId: &projectutil.Nullable[string]{Value: externalId},
		Email:      &projectutil.Nullable[string]{Value: email},
	}

	_, err1 := pClient.Users.SaveUser(context.Background(), user)
	if err1 != nil {
		log.Fatalf("Failed to save user: %v", err1)
	}

	// 2. Create Broadcast
	targetTitle := fmt.Sprintf("Mark Read Go Demo - %s", runId)
	broadcast := projectclientbroadcasts.Broadcast{
		Title: projectutil.ToPointer(targetTitle),
		Recipients: &projectutil.Nullable[[]shared.User]{
			Value: []shared.User{
				{
					ExternalId: &projectutil.Nullable[string]{Value: externalId},
				},
			},
		},
	}
	_, err2 := pClient.Broadcasts.CreateBroadcast(context.Background(), broadcast)
	if err2 != nil {
		log.Fatalf("Failed to create broadcast: %v", err2)
	}

	// 3. Mint JWT
	userJwt, err3 := mintUserJWT(email, externalId, apiKey, secretKey)
	if err3 != nil {
		log.Fatalf("Failed to mint JWT: %v", err3)
	}

	// 4. UserClient to list notifications
	uConfig := userclientconfig.NewConfig()
	uConfig.SetAccessToken(userJwt)
	uClient := userclient.NewClient(uConfig)

	var targetNotificationId string
	timeout := time.After(60 * time.Second)
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	params := userclientnotifications.ListNotificationsRequestParams{}

findLoop:
	for {
		select {
		case <-timeout:
			log.Fatal("Timeout waiting for notification")
		case <-ticker.C:
			resp, err4 := uClient.Notifications.ListNotifications(context.Background(), params)
			if err4 != nil {
				log.Printf("Failed to list notifications: %v", err4)
				continue
			}

			for _, n := range resp.Data.Data {
				if n.Title != nil && *n.Title == targetTitle {
					targetNotificationId = *n.Id
					break findLoop
				}
			}
		}
	}

	// 5. Mark as read
	_, err5 := uClient.Notifications.MarkNotificationRead(context.Background(), targetNotificationId)
	if err5 != nil {
		log.Fatalf("Failed to mark notification as read: %v", err5)
	}

	// Write to log file
	outputLine := fmt.Sprintf("Notification ID: %s\n", targetNotificationId)
	err6 := os.WriteFile("output.log", []byte(outputLine), 0644)
	if err6 != nil {
		log.Fatalf("Failed to write to log file: %v", err6)
	}
	
	fmt.Printf("Successfully marked notification %s as read\n", targetNotificationId)
}
