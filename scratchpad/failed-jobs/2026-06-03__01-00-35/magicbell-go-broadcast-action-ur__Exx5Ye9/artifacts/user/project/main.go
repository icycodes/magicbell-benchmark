package main

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/magicbell/magicbell-go/pkg/project-client/broadcasts"
	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
)

func main() {
	// 1. Read environment variables
	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		fmt.Println("Error: ZEALT_RUN_ID environment variable is not set")
		os.Exit(1)
	}

	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	if magicbellEmail == "" {
		fmt.Println("Error: MAGICBELL_EMAIL environment variable is not set")
		os.Exit(1)
	}

	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		fmt.Println("Error: MAGICBELL_PROJECT_TOKEN environment variable is not set")
		os.Exit(1)
	}

	// 2. Format recipient email
	emailPrefix := magicbellEmail
	if strings.Contains(emailPrefix, "@") {
		parts := strings.Split(emailPrefix, "@")
		emailPrefix = parts[0]
	}
	recipientEmail := fmt.Sprintf("%s+%s@gmail.com", emailPrefix, runID)
	actionURL := fmt.Sprintf("https://example.com/action-%s", runID)

	fmt.Printf("Run ID: %s\n", runID)
	fmt.Printf("Recipient Email: %s\n", recipientEmail)
	fmt.Printf("Action URL: %s\n", actionURL)

	// 3. Configure the MagicBell Go SDK ProjectClient
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	config.SetTimeout(30 * time.Second)

	sdk := client.NewClient(config)

	// 4. Construct the Broadcast
	broadcastPayload := broadcasts.Broadcast{
		Title:     util.ToPointer("Action Required Notification"),
		Content:   util.ToPointer(util.Nullable[string]{Value: "Please click the action URL to proceed with your run.", IsNull: false}),
		ActionUrl: util.ToPointer(util.Nullable[string]{Value: actionURL, IsNull: false}),
		Recipients: util.ToPointer(util.Nullable[[]shared.User]{
			Value: []shared.User{
				{
					Email: util.ToPointer(util.Nullable[string]{Value: recipientEmail, IsNull: false}),
				},
			},
			IsNull: false,
		}),
	}

	// 5. Execute the broadcast creation
	ctx := context.Background()
	resp, sdkErr := sdk.Broadcasts.CreateBroadcast(ctx, broadcastPayload)
	if sdkErr != nil {
		fmt.Printf("Error creating broadcast: %v\n", sdkErr.Err)
		if len(sdkErr.Body) > 0 {
			fmt.Printf("Response Body: %s\n", string(sdkErr.Body))
		}
		os.Exit(1)
	}

	broadcastID := ""
	if resp.Data.Id != nil {
		broadcastID = *resp.Data.Id
	}

	if broadcastID == "" {
		fmt.Println("Error: Broadcast ID in response is empty or nil")
		os.Exit(1)
	}

	fmt.Printf("Successfully created broadcast! ID: %s\n", broadcastID)

	// 6. Write the resulting Broadcast ID to /home/user/project/output.log
	logFilePath := "/home/user/project/output.log"
	logContent := fmt.Sprintf("Broadcast ID: %s\n", broadcastID)
	err := os.WriteFile(logFilePath, []byte(logContent), 0644)
	if err != nil {
		fmt.Printf("Error writing to log file: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Successfully saved Broadcast ID to %s\n", logFilePath)
}
