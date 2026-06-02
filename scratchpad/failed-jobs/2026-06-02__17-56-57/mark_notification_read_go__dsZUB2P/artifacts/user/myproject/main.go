package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	jwt "github.com/golang-jwt/jwt/v5"
	projectbroadcasts "github.com/magicbell/magicbell-go/pkg/project-client/broadcasts"
	projectclient "github.com/magicbell/magicbell-go/pkg/project-client/client"
	projectconfig "github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	projectshared "github.com/magicbell/magicbell-go/pkg/project-client/shared"
	projectutil "github.com/magicbell/magicbell-go/pkg/project-client/util"
	userclient "github.com/magicbell/magicbell-go/pkg/user-client/client"
	userconfig "github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	usernotifications "github.com/magicbell/magicbell-go/pkg/user-client/notifications"
)

const (
	pollTimeout = 60 * time.Second
	pollInterval = 3 * time.Second
)

func main() {
	runID := mustEnv("ZEALT_RUN_ID")
	baseEmail := mustEnv("MAGICBELL_EMAIL")
	projectToken := mustEnv("MAGICBELL_PROJECT_TOKEN")
	apiKey := mustEnv("MAGICBELL_API_KEY")
	secretKey := mustEnv("MAGICBELL_SECRET_KEY")

	email := buildRecipientEmail(baseEmail, runID)
	externalID := fmt.Sprintf("user-mark-read-go-%s", runID)
	title := fmt.Sprintf("Mark Read Go Demo - %s", runID)

	ctx := context.Background()
	projectClient := newProjectClient(projectToken)

	user := projectshared.User{
		Email:      &projectutil.Nullable[string]{Value: email},
		ExternalId: &projectutil.Nullable[string]{Value: externalID},
	}
	if _, err := projectClient.Users.SaveUser(ctx, user); err != nil {
		log.Fatalf("upsert user failed: %s", err.Error())
	}

	broadcast := projectbroadcasts.Broadcast{
		Title: projectutil.ToPointer(title),
		Recipients: &projectutil.Nullable[[]projectshared.User]{
			Value: []projectshared.User{
				{
					ExternalId: &projectutil.Nullable[string]{Value: externalID},
					Email:      &projectutil.Nullable[string]{Value: email},
				},
			},
		},
	}
	if _, err := projectClient.Broadcasts.CreateBroadcast(ctx, broadcast); err != nil {
		log.Fatalf("create broadcast failed: %s", err.Error())
	}

	userJWT, err := buildUserJWT(email, externalID, apiKey, secretKey)
	if err != nil {
		log.Fatalf("build user jwt failed: %v", err)
	}

	userClient := newUserClient(userJWT)
	notificationID, err := findNotificationID(ctx, userClient, title)
	if err != nil {
		log.Fatalf("find notification failed: %v", err)
	}

	if _, err := userClient.Notifications.MarkNotificationRead(ctx, notificationID); err != nil {
		log.Fatalf("mark notification read failed: %s", err.Error())
	}

	output := fmt.Sprintf("Notification ID: %s\n", notificationID)
	if err := os.WriteFile("/home/user/myproject/output.log", []byte(output), 0o644); err != nil {
		log.Fatalf("write output log failed: %v", err)
	}
}

func mustEnv(key string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		log.Fatalf("missing required environment variable: %s", key)
	}
	return value
}

func buildRecipientEmail(baseEmail, runID string) string {
	parts := strings.Split(baseEmail, "@")
	if len(parts) != 2 {
		log.Fatalf("invalid MAGICBELL_EMAIL: %s", baseEmail)
	}
	return fmt.Sprintf("%s+mark-read-go-%s@%s", parts[0], runID, parts[1])
}

func newProjectClient(projectToken string) *projectclient.Client {
	config := projectconfig.NewConfig()
	config.SetAccessToken(projectToken)
	return projectclient.NewClient(config)
}

func newUserClient(userJWT string) *userclient.Client {
	config := userconfig.NewConfig()
	config.SetAccessToken(userJWT)
	return userclient.NewClient(config)
}

func buildUserJWT(email, externalID, apiKey, secretKey string) (string, error) {
	claims := jwt.MapClaims{
		"user_email":       email,
		"user_external_id": externalID,
		"api_key":          apiKey,
		"exp":              time.Now().Add(365 * 24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secretKey))
}

func findNotificationID(ctx context.Context, userClient *userclient.Client, title string) (string, error) {
	deadline := time.Now().Add(pollTimeout)
	params := usernotifications.ListNotificationsRequestParams{}
	params.SetLimit(20)
	for time.Now().Before(deadline) {
		resp, err := userClient.Notifications.ListNotifications(ctx, params)
		if err != nil {
			return "", fmt.Errorf("list notifications failed: %s", err.Error())
		}
		for _, notification := range resp.Data.Data {
			if notification.Title != nil && *notification.Title == title && notification.Id != nil {
				return *notification.Id, nil
			}
		}
		time.Sleep(pollInterval)
	}
	return "", fmt.Errorf("notification with title %q not found within %s", title, pollTimeout)
}
