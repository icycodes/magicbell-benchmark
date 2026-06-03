package main

import (
	"context"
	"fmt"
	"os"

	"github.com/golang-jwt/jwt/v5"
	"github.com/magicbell/magicbell-go/pkg/user-client/client"
	"github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/user-client/shared"
)

func main() {
	runID := os.Getenv("ZEALT_RUN_ID")
	email := os.Getenv("MAGICBELL_EMAIL")
	apiKey := os.Getenv("MAGICBELL_API_KEY")
	secretKey := os.Getenv("MAGICBELL_SECRET_KEY")

	// Generate JWT
	claims := jwt.MapClaims{
		"user_email":       fmt.Sprintf("%s+%s@gmail.com", email, runID),
		"user_external_id": fmt.Sprintf("user_%s", runID),
		"api_key":          apiKey,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		panic(err)
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(tokenString)
	mbClient := client.NewClient(config)

	tokenName := fmt.Sprintf("web_push_token_%s", runID)
	endpoint := fmt.Sprintf("https://example.com/%s", tokenName)
	auth := "dummy_auth"
	p256dh := "dummy_p256dh"

	keys := shared.WebPushTokenPayloadKeys{
		Auth:   &auth,
		P256dh: &p256dh,
	}

	payload := shared.WebPushTokenPayload{
		Endpoint: &endpoint,
		Keys:     &keys,
	}

	resp, clientErr := mbClient.Channels.SaveWebPushToken(context.Background(), payload)
	if clientErr != nil {
		fmt.Printf("Error: %v\n", clientErr.Error())
		if clientErr.Body != nil {
			fmt.Printf("Response: %s\n", string(clientErr.Body))
		}
		os.Exit(1)
	}

	_ = resp

	logMessage := fmt.Sprintf("Successfully registered web push token: %s\n", tokenName)
	err = os.WriteFile("output.log", []byte(logMessage), 0644)
	if err != nil {
		panic(err)
	}

	fmt.Print(logMessage)
}
