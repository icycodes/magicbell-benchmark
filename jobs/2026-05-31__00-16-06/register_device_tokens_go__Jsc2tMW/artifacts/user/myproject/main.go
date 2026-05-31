package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	projectclient "github.com/magicbell/magicbell-go/pkg/project-client/client"
	projectchannels "github.com/magicbell/magicbell-go/pkg/project-client/channels"
	projectconfig "github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	projectusers "github.com/magicbell/magicbell-go/pkg/project-client/users"
	userclient "github.com/magicbell/magicbell-go/pkg/user-client/client"
	userchannels "github.com/magicbell/magicbell-go/pkg/user-client/channels"
	userconfig "github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	usershared "github.com/magicbell/magicbell-go/pkg/user-client/shared"
	"github.com/magicbell/magicbell-go/pkg/user-client/util"
)

func main() {
	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		log.Fatal("ZEALT_RUN_ID not set")
	}
	secretKey := os.Getenv("MAGICBELL_SECRET_KEY")
	apiKey := os.Getenv("MAGICBELL_API_KEY")
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")

	userEmail := fmt.Sprintf("user-%s@example.com", runID)

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_email": userEmail,
		"api_key":    apiKey,
	})

	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		log.Fatalf("Failed to sign JWT: %v", err)
	}

	// Initialize UserClient
	uConfig := userconfig.NewConfig()
	uConfig.SetAccessToken(tokenString)
	uClient := userclient.NewClient(uConfig)

	// Register Web Push Token
	endpoint := fmt.Sprintf("https://updates.push.services.mozilla.com/wpush/v2/gAAAAAB-%s", runID)
	p256dh := fmt.Sprintf("p256dh-key-%s", runID)
	auth := fmt.Sprintf("auth-secret-%s", runID)

	_, errResponse := uClient.Channels.SaveWebPushToken(context.Background(), usershared.WebPushTokenPayload{
		Endpoint: util.ToPointer(endpoint),
		Keys: &usershared.WebPushTokenPayloadKeys{
			P256dh: util.ToPointer(p256dh),
			Auth:   util.ToPointer(auth),
		},
	})
	if errResponse != nil {
		log.Fatalf("Failed to save web push token: %v, body: %s", errResponse, string(*errResponse.Data))
	}

	// Register APNs Token
	baseToken := strings.Repeat("1", 64)
	apnsToken := baseToken[:64-len(runID)] + runID

	_, errResponse1 := uClient.Channels.SaveApnsToken(context.Background(), userchannels.ApnsTokenPayload{
		DeviceToken: util.ToPointer(apnsToken),
	})
	if errResponse1 != nil {
		log.Fatalf("Failed to save APNs token: %v, body: %s", errResponse1, string(*errResponse1.Data))
	}

	// Initialize ProjectClient
	pConfig := projectconfig.NewConfig()
	pConfig.SetAccessToken(projectToken)
	pClient := projectclient.NewClient(pConfig)

	// Get user UUID
	usersResp, errResponseUser := pClient.Users.ListUsers(context.Background(), projectusers.ListUsersRequestParams{})
	if errResponseUser != nil {
		log.Fatalf("Failed to list users: %v, body: %s", errResponseUser, string(*errResponseUser.Data))
	}
	var userId string
	for _, u := range usersResp.Data.Data {
		if u.Email != nil && !u.Email.IsNull && u.Email.Value == userEmail {
			userId = *u.Id
			break
		}
	}
	if userId == "" {
		log.Fatalf("User not found")
	}

	// List Web Push Tokens
	webPushTokensResp, errResponse2 := pClient.Channels.ListUserWebPushTokens(context.Background(), userId, projectchannels.ListUserWebPushTokensRequestParams{})
	if errResponse2 != nil {
		log.Fatalf("Failed to list web push tokens: %v, body: %s", errResponse2, string(*errResponse2.Data))
	}

	var webPushTokenID string
	for _, t := range webPushTokensResp.Data.Data {
		if t.Endpoint != nil && *t.Endpoint == endpoint {
			webPushTokenID = *t.Id
			break
		}
	}

	// List APNs Tokens
	apnsTokensResp, errResponse3 := pClient.Channels.ListUserApnsTokens(context.Background(), userId, projectchannels.ListUserApnsTokensRequestParams{})
	if errResponse3 != nil {
		log.Fatalf("Failed to list APNs tokens: %v, body: %s", errResponse3, string(*errResponse3.Data))
	}

	var apnsTokenID string
	for _, t := range apnsTokensResp.Data.Data {
		if t.DeviceToken != nil && *t.DeviceToken == apnsToken {
			apnsTokenID = *t.Id
			break
		}
	}

	// Write to output.log
	f, err := os.Create("/home/user/myproject/output.log")
	if err != nil {
		log.Fatalf("Failed to create log file: %v", err)
	}
	defer f.Close()

	fmt.Fprintf(f, "Web Push Token ID: %s\n", webPushTokenID)
	fmt.Fprintf(f, "APNs Token ID: %s\n", apnsTokenID)
	fmt.Printf("Web Push Token ID: %s\n", webPushTokenID)
	fmt.Printf("APNs Token ID: %s\n", apnsTokenID)
}
