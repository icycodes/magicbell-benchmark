package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	projectclient "github.com/magicbell/magicbell-go/pkg/project-client/client"
	projectconfig "github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	projectbroadcasts "github.com/magicbell/magicbell-go/pkg/project-client/broadcasts"
	projectshared "github.com/magicbell/magicbell-go/pkg/project-client/shared"
	projectutil "github.com/magicbell/magicbell-go/pkg/project-client/util"
	userclient "github.com/magicbell/magicbell-go/pkg/user-client/client"
	userconfig "github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	usernotifications "github.com/magicbell/magicbell-go/pkg/user-client/notifications"
	userutil "github.com/magicbell/magicbell-go/pkg/user-client/util"
)

func mustEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("missing required environment variable: %s", key)
	}
	return value
}

func main() {
	projectToken := mustEnv("MAGICBELL_PROJECT_TOKEN")
	apiKey := mustEnv("MAGICBELL_API_KEY")
	secretKey := mustEnv("MAGICBELL_SECRET_KEY")
	gmailUser := mustEnv("GMAIL_USER_NAME")
	runID := mustEnv("ZEALT_RUN_ID")

	userEmail := fmt.Sprintf("%s+%s@gmail.com", gmailUser, runID)
	userExternalID := fmt.Sprintf("user_%s", runID)
	broadcastTitle := fmt.Sprintf("Notification %s", runID)
	broadcastContent := fmt.Sprintf("Hello, this is a test notification for run %s!", runID)

	projectCfg := projectconfig.NewConfig()
	projectCfg.SetAccessToken(projectToken)
	projectSDK := projectclient.NewClient(projectCfg)

	ctx := context.Background()
	user := projectshared.User{
		Email: projectutil.ToPointer(projectutil.Nullable[string]{Value: userEmail}),
		ExternalId: projectutil.ToPointer(projectutil.Nullable[string]{Value: userExternalID}),
	}

	_, userErr := projectSDK.Users.SaveUser(ctx, user)
	if userErr != nil {
		log.Fatalf("failed to upsert user: %v", userErr)
	}

	broadcast := projectbroadcasts.Broadcast{
		Title: projectutil.ToPointer(broadcastTitle),
		Content: projectutil.ToPointer(projectutil.Nullable[string]{Value: broadcastContent}),
		Recipients: projectutil.ToPointer(projectutil.Nullable[[]projectshared.User]{Value: []projectshared.User{user}}),
	}

	_, broadcastErr := projectSDK.Broadcasts.CreateBroadcast(ctx, broadcast)
	if broadcastErr != nil {
		log.Fatalf("failed to create broadcast: %v", broadcastErr)
	}

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_email": userEmail,
		"user_external_id": userExternalID,
		"api_key": apiKey,
	})

	signedToken, signErr := jwtToken.SignedString([]byte(secretKey))
	if signErr != nil {
		log.Fatalf("failed to sign user jwt: %v", signErr)
	}

	userCfg := userconfig.NewConfig()
	userCfg.SetAccessToken(signedToken)
	userSDK := userclient.NewClient(userCfg)

	var notificationsTitle string
	var notificationsCount int
	for attempt := 0; attempt < 10; attempt++ {
		params := usernotifications.ListNotificationsRequestParams{
			Limit: userutil.ToPointer(int64(10)),
		}
		response, listErr := userSDK.Notifications.ListNotifications(ctx, params)
		if listErr != nil {
			log.Fatalf("failed to list notifications: %v", listErr)
		}
		collection := response.Data
		notificationsCount = len(collection.Data)
		if notificationsCount > 0 {
			if collection.Data[0].Title != nil {
				notificationsTitle = *collection.Data[0].Title
			}
			break
		}
		time.Sleep(2 * time.Second)
	}

	outputFile, fileErr := os.Create("/home/user/myproject/output.log")
	if fileErr != nil {
		log.Fatalf("failed to create output log: %v", fileErr)
	}
	defer outputFile.Close()

	_, writeErr := fmt.Fprintf(outputFile, "User JWT: %s\n", signedToken)
	if writeErr != nil {
		log.Fatalf("failed to write jwt to output log: %v", writeErr)
	}
	_, writeErr = fmt.Fprintf(outputFile, "Notifications Count: %d\n", notificationsCount)
	if writeErr != nil {
		log.Fatalf("failed to write count to output log: %v", writeErr)
	}
	_, writeErr = fmt.Fprintf(outputFile, "Latest Notification Title: %s\n", notificationsTitle)
	if writeErr != nil {
		log.Fatalf("failed to write title to output log: %v", writeErr)
	}
}
