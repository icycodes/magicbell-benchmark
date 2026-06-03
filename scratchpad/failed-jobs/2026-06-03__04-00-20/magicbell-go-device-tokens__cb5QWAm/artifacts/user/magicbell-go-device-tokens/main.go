package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/magicbell/magicbell-go/pkg/user-client/client"
	"github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/user-client/shared"
	"github.com/magicbell/magicbell-go/pkg/user-client/util"
)

func main() {
	// Read environment variables
	zealtRunID := os.Getenv("ZEALT_RUN_ID")
	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	magicbellAPIKey := os.Getenv("MAGICBELL_API_KEY")
	magicbellSecretKey := os.Getenv("MAGICBELL_SECRET_KEY")

	if zealtRunID == "" || magicbellEmail == "" || magicbellAPIKey == "" || magicbellSecretKey == "" {
		log.Fatal("Missing required environment variables: ZEALT_RUN_ID, MAGICBELL_EMAIL, MAGICBELL_API_KEY, MAGICBELL_SECRET_KEY")
	}

	// Generate User JWT
	userEmail := fmt.Sprintf("%s+%s@gmail.com", magicbellEmail, zealtRunID)
	userExternalID := fmt.Sprintf("user_%s", zealtRunID)

	now := time.Now()
	claims := jwt.MapClaims{
		"api_key":          magicbellAPIKey,
		"user_email":       userEmail,
		"user_external_id": userExternalID,
		"iat":              now.Unix(),
		"exp":              now.Add(1 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(magicbellSecretKey))
	if err != nil {
		log.Fatalf("Failed to sign JWT: %v", err)
	}

	fmt.Printf("Generated User JWT for %s\n", userEmail)

	// Initialize MagicBell User SDK client
	config := clientconfig.NewConfig()
	config.SetAccessToken(signedToken)

	sdk := client.NewClient(config)

	// Register web push device token
	tokenName := fmt.Sprintf("web_push_token_%s", zealtRunID)
	endpointURL := fmt.Sprintf("https://webpush.magicbell.com/%s", tokenName)

	webPushTokenPayloadKeys := shared.WebPushTokenPayloadKeys{
		Auth:   util.ToPointer(tokenName + "_auth_key"),
		P256dh: util.ToPointer(tokenName + "_p256dh_key"),
	}

	request := shared.WebPushTokenPayload{
		Endpoint: util.ToPointer(endpointURL),
		Keys:     &webPushTokenPayloadKeys,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	response, clientErr := sdk.Channels.SaveWebPushToken(ctx, request)
	if clientErr != nil {
		errMsg := "unknown error"
		if clientErr.Err != nil {
			errMsg = clientErr.Err.Error()
		}
		statusCode := 0
		if clientErr.Metadata.StatusCode != 0 {
			statusCode = clientErr.Metadata.StatusCode
		}
		body := ""
		if clientErr.Body != nil {
			body = string(clientErr.Body)
		}
		log.Fatalf("Failed to register web push token: %s (status: %d, body: %s)", errMsg, statusCode, body)
	}

	fmt.Printf("Response: %+v\n", response)

	// Write success message to log file
	successMessage := fmt.Sprintf("Successfully registered web push token: %s", tokenName)
	logPath := "/home/user/magicbell-go-device-tokens/output.log"

	err = os.WriteFile(logPath, []byte(successMessage+"\n"), 0644)
	if err != nil {
		log.Fatalf("Failed to write log file: %v", err)
	}

	fmt.Println(successMessage)
}