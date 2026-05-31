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
	projectchannels "github.com/magicbell/magicbell-go/pkg/project-client/channels"
	projectusers "github.com/magicbell/magicbell-go/pkg/project-client/users"
	projectutil "github.com/magicbell/magicbell-go/pkg/project-client/util"
	userclient "github.com/magicbell/magicbell-go/pkg/user-client/client"
	userclientconfig "github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	userchannels "github.com/magicbell/magicbell-go/pkg/user-client/channels"
	usershared "github.com/magicbell/magicbell-go/pkg/user-client/shared"
	userutil "github.com/magicbell/magicbell-go/pkg/user-client/util"
)

func derefString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func derefNullableString(n *projectutil.Nullable[string]) string {
	if n == nil || n.IsNull {
		return ""
	}
	return n.Value
}

func main() {
	// Read environment variables
	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		log.Fatal("ZEALT_RUN_ID environment variable is required")
	}

	apiKey := os.Getenv("MAGICBELL_API_KEY")
	if apiKey == "" {
		log.Fatal("MAGICBELL_API_KEY environment variable is required")
	}

	secretKey := os.Getenv("MAGICBELL_SECRET_KEY")
	if secretKey == "" {
		log.Fatal("MAGICBELL_SECRET_KEY environment variable is required")
	}

	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN environment variable is required")
	}

	userEmail := fmt.Sprintf("user-%s@example.com", runID)

	// Generate User JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_email": userEmail,
		"api_key":   apiKey,
		"exp":       time.Now().Add(1 * time.Hour).Unix(),
	})

	userJWT, err := token.SignedString([]byte(secretKey))
	if err != nil {
		log.Fatalf("Failed to sign JWT: %v", err)
	}

	// Initialize UserClient with the generated User JWT
	userConfig := userclientconfig.NewConfig()
	userConfig.SetAccessToken(userJWT)
	userClient := userclient.NewClient(userConfig)

	ctx := context.Background()

	// Register Web Push Token
	webPushEndpoint := fmt.Sprintf("https://updates.push.services.mozilla.com/wpush/v2/gAAAAAB-%s", runID)
	webPushTokenPayload := usershared.WebPushTokenPayload{
		Endpoint: userutil.ToPointer(webPushEndpoint),
		Keys: &usershared.WebPushTokenPayloadKeys{
			P256dh: userutil.ToPointer(fmt.Sprintf("p256dh-key-%s", runID)),
			Auth:   userutil.ToPointer(fmt.Sprintf("auth-secret-%s", runID)),
		},
	}

	webPushResp, webPushErr := userClient.Channels.SaveWebPushToken(ctx, webPushTokenPayload)
	if webPushErr != nil {
		log.Fatalf("Failed to save Web Push token: %v", webPushErr)
	}
	if webPushResp == nil {
		log.Fatal("Web Push token response is nil")
	}
	log.Printf("Web Push token registered successfully")

	// Register APNs Token
	// Construct a 64-character APNs device token by starting with 64 '1's and replacing the suffix with runID
	ones64 := strings.Repeat("1", 64)
	apnsDeviceToken := ones64[:64-len(runID)] + runID
	if len(apnsDeviceToken) != 64 {
		log.Fatalf("APNs device token length is %d, expected 64", len(apnsDeviceToken))
	}

	apnsTokenPayload := userchannels.ApnsTokenPayload{
		DeviceToken: userutil.ToPointer(apnsDeviceToken),
	}

	apnsResp, apnsErr := userClient.Channels.SaveApnsToken(ctx, apnsTokenPayload)
	if apnsErr != nil {
		log.Fatalf("Failed to save APNs token: %v", apnsErr)
	}
	if apnsResp == nil {
		log.Fatal("APNs token response is nil")
	}
	log.Printf("APNs token registered successfully")

	// Initialize ProjectClient with the project token
	projectConfig := projectclientconfig.NewConfig()
	projectConfig.SetAccessToken(projectToken)
	projectClient := projectclient.NewClient(projectConfig)

	// Find the user by email via the project API to get the correct user UUID
	var userUUID string
	listResp, listErr := projectClient.Users.ListUsers(ctx, projectusers.ListUsersRequestParams{
		Query: projectutil.ToPointer(userEmail),
	})
	if listErr != nil {
		log.Printf("Failed to list users: %v", listErr)
		log.Printf("Error body: %s", string(listErr.Body))
	} else if listResp != nil {
		users := listResp.Data.GetData()
		log.Printf("Found %d users", len(users))
		for _, u := range users {
			email := derefNullableString(u.GetEmail())
			id := derefString(u.GetId())
			log.Printf("User: id=%s, email=%s", id, email)
			if email == userEmail {
				userUUID = id
				break
			}
		}
	}

	if userUUID == "" {
		log.Fatal("Failed to find user by email via project API")
	}
	log.Printf("Using user UUID: %s", userUUID)

	// List Web Push tokens for the user to verify
	webPushListResp, webPushListErr := projectClient.Channels.ListUserWebPushTokens(ctx, userUUID, projectchannels.ListUserWebPushTokensRequestParams{})
	if webPushListErr != nil {
		log.Printf("Failed to list Web Push tokens: %v", webPushListErr)
		log.Printf("Error body: %s", string(webPushListErr.Body))
		log.Fatalf("Cannot continue without Web Push token list")
	}

	var webPushTokenID string
	if webPushListResp != nil && len(webPushListResp.Data.GetData()) > 0 {
		for _, wpToken := range webPushListResp.Data.GetData() {
			if derefString(wpToken.GetEndpoint()) == webPushEndpoint {
				webPushTokenID = derefString(wpToken.GetId())
				log.Printf("Verified Web Push token - Endpoint: %s, ID: %s", derefString(wpToken.GetEndpoint()), webPushTokenID)
				break
			}
		}
		if webPushTokenID == "" {
			webPushTokenID = derefString(webPushListResp.Data.GetData()[0].GetId())
			log.Printf("Using first Web Push token ID: %s", webPushTokenID)
		}
	} else {
		log.Fatal("No Web Push tokens found for user")
	}

	// List APNs tokens for the user to verify
	apnsListResp, apnsListErr := projectClient.Channels.ListUserApnsTokens(ctx, userUUID, projectchannels.ListUserApnsTokensRequestParams{})
	if apnsListErr != nil {
		log.Fatalf("Failed to list APNs tokens: %v", apnsListErr)
	}

	var apnsTokenID string
	if apnsListResp != nil && len(apnsListResp.Data.GetData()) > 0 {
		for _, apnsToken := range apnsListResp.Data.GetData() {
			if derefString(apnsToken.GetDeviceToken()) == apnsDeviceToken {
				apnsTokenID = derefString(apnsToken.GetId())
				log.Printf("Verified APNs token - DeviceToken: %s, ID: %s", derefString(apnsToken.GetDeviceToken()), apnsTokenID)
				break
			}
		}
		if apnsTokenID == "" {
			apnsTokenID = derefString(apnsListResp.Data.GetData()[0].GetId())
			log.Printf("Using first APNs token ID: %s", apnsTokenID)
		}
	} else {
		log.Fatal("No APNs tokens found for user")
	}

	// Write results to output.log
	logFile, err := os.Create("/home/user/myproject/output.log")
	if err != nil {
		log.Fatalf("Failed to create output.log: %v", err)
	}
	defer logFile.Close()

	fmt.Fprintf(logFile, "Web Push Token ID: %s\n", webPushTokenID)
	fmt.Fprintf(logFile, "APNs Token ID: %s\n", apnsTokenID)

	log.Printf("Results written to /home/user/myproject/output.log")
	log.Printf("Web Push Token ID: %s", webPushTokenID)
	log.Printf("APNs Token ID: %s", apnsTokenID)
}