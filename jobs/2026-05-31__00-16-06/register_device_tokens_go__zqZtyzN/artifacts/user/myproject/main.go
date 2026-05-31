package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	projectchannels "github.com/magicbell/magicbell-go/pkg/project-client/channels"
	projectclient "github.com/magicbell/magicbell-go/pkg/project-client/client"
	projectconfig "github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	projectusers "github.com/magicbell/magicbell-go/pkg/project-client/users"
	userchannels "github.com/magicbell/magicbell-go/pkg/user-client/channels"
	userclient "github.com/magicbell/magicbell-go/pkg/user-client/client"
	userconfig "github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	usershared "github.com/magicbell/magicbell-go/pkg/user-client/shared"
	userutil "github.com/magicbell/magicbell-go/pkg/user-client/util"
)

func main() {
	log.SetFlags(0)

	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		log.Fatal("ZEALT_RUN_ID is required")
	}
	apiKey := os.Getenv("MAGICBELL_API_KEY")
	if apiKey == "" {
		log.Fatal("MAGICBELL_API_KEY is required")
	}
	secret := os.Getenv("MAGICBELL_SECRET_KEY")
	if secret == "" {
		log.Fatal("MAGICBELL_SECRET_KEY is required")
	}
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN is required")
	}

	userEmail := fmt.Sprintf("user-%s@example.com", runID)

	jwtToken, err := signUserJWT(userEmail, apiKey, secret)
	if err != nil {
		log.Fatalf("sign user jwt: %v", err)
	}

	userCfg := userconfig.NewConfig()
	userCfg.SetAccessToken(jwtToken)
	userClient := userclient.NewClient(userCfg)

	ctx := context.Background()

	webPushEndpoint := fmt.Sprintf("https://updates.push.services.mozilla.com/wpush/v2/gAAAAAB-%s", runID)
	webPushReq := usershared.WebPushTokenPayload{
		Endpoint: userutil.ToPointer(webPushEndpoint),
		Keys: &usershared.WebPushTokenPayloadKeys{
			P256dh: userutil.ToPointer(fmt.Sprintf("p256dh-key-%s", runID)),
			Auth:   userutil.ToPointer(fmt.Sprintf("auth-secret-%s", runID)),
		},
	}

	_, webPushErr := userClient.Channels.SaveWebPushToken(ctx, webPushReq)
	if webPushErr != nil {
		log.Fatalf("save web push token: %v (status %d, body %s)", webPushErr, webPushErr.Metadata.StatusCode, string(webPushErr.Body))
	}

	apnsToken := buildApnsToken(runID)
	apnsReq := userchannels.ApnsTokenPayload{
		DeviceToken: userutil.ToPointer(apnsToken),
	}
	_, apnsErr := userClient.Channels.SaveApnsToken(ctx, apnsReq)
	if apnsErr != nil {
		log.Fatalf("save apns token: %v (status %d, body %s)", apnsErr, apnsErr.Metadata.StatusCode, string(apnsErr.Body))
	}

	projectCfg := projectconfig.NewConfig()
	projectCfg.SetAccessToken(projectToken)
	projectClient := projectclient.NewClient(projectCfg)

	userParams := projectusers.ListUsersRequestParams{}
	userParams.SetQuery(userEmail)
	usersResp, usersErr := projectClient.Users.ListUsers(ctx, userParams)
	if usersErr != nil {
		log.Fatalf("list users: %v (status %d, body %s)", usersErr, usersErr.Metadata.StatusCode, string(usersErr.Body))
	}
	userID := ""
	for _, user := range usersResp.Data.Data {
		if user.Email != nil && !user.Email.IsNull && user.Email.Value == userEmail {
			if user.Id != nil {
				userID = *user.Id
			}
			break
		}
	}
	if userID == "" {
		log.Fatalf("user not found for email %s", userEmail)
	}

	webPushResp, webPushListErr := projectClient.Channels.ListUserWebPushTokens(
		ctx,
		userID,
		projectchannels.ListUserWebPushTokensRequestParams{},
	)
	if webPushListErr != nil {
		log.Fatalf("list user web push tokens: %v (status %d, body %s)", webPushListErr, webPushListErr.Metadata.StatusCode, string(webPushListErr.Body))
	}
	webPushID := ""
	for _, token := range webPushResp.Data.Data {
		if token.Endpoint != nil && *token.Endpoint == webPushEndpoint {
			if token.Id != nil {
				webPushID = *token.Id
			}
			break
		}
	}
	if webPushID == "" {
		log.Fatal("registered web push token not found")
	}

	apnsResp, apnsListErr := projectClient.Channels.ListUserApnsTokens(
		ctx,
		userID,
		projectchannels.ListUserApnsTokensRequestParams{},
	)
	if apnsListErr != nil {
		log.Fatalf("list user apns tokens: %v (status %d, body %s)", apnsListErr, apnsListErr.Metadata.StatusCode, string(apnsListErr.Body))
	}
	apnsID := ""
	for _, token := range apnsResp.Data.Data {
		if token.DeviceToken != nil && *token.DeviceToken == apnsToken {
			if token.Id != nil {
				apnsID = *token.Id
			}
			break
		}
	}
	if apnsID == "" {
		log.Fatal("registered apns token not found")
	}

	outputPath := "/home/user/myproject/output.log"
	output := fmt.Sprintf("Web Push Token ID: %s\nAPNs Token ID: %s\n", webPushID, apnsID)
	if err := os.WriteFile(outputPath, []byte(output), 0o644); err != nil {
		log.Fatalf("write output log: %v", err)
	}
}

func signUserJWT(userEmail, apiKey, secret string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_email": userEmail,
		"api_key":    apiKey,
	})
	return token.SignedString([]byte(secret))
}

func buildApnsToken(runID string) string {
	base := strings.Repeat("1", 64)
	if len(runID) >= 64 {
		return runID[:64]
	}
	return base[:64-len(runID)] + runID
}
