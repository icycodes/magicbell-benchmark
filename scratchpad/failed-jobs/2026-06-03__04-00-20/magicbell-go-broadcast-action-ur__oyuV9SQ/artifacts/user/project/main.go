package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/magicbell/magicbell-go/pkg/project-client/broadcasts"
	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
)

func main() {
	// Read environment variables
	runID := os.Getenv("ZEALT_RUN_ID")
	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")

	if runID == "" {
		log.Fatal("ZEALT_RUN_ID environment variable is required")
	}
	if magicbellEmail == "" {
		log.Fatal("MAGICBELL_EMAIL environment variable is required")
	}
	if projectToken == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN environment variable is required")
	}

	// Construct the recipient email using plus format
	recipientEmail := fmt.Sprintf("%s+%s@gmail.com", magicbellEmail, runID)

	// Construct the action URL with the run ID
	actionURL := fmt.Sprintf("https://example.com/action-%s", runID)

	// Configure the MagicBell ProjectClient
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	sdk := client.NewClient(config)

	// Create a recipient user with the constructed email
	recipient := shared.User{
		Email: util.ToPointer(util.Nullable[string]{Value: recipientEmail}),
	}

	// Construct the broadcast request
	req := broadcasts.Broadcast{
		Title:     util.ToPointer("Important Notification"),
		Content:   util.ToPointer(util.Nullable[string]{Value: "You have a new action that requires your attention."}),
		ActionUrl: util.ToPointer(util.Nullable[string]{Value: actionURL}),
		Recipients: util.ToPointer(util.Nullable[[]shared.User]{
			Value: []shared.User{recipient},
		}),
	}

	// Execute the broadcast creation
	ctx := context.Background()
	response, clientErr := sdk.Broadcasts.CreateBroadcast(ctx, req)
	if clientErr != nil {
		log.Fatalf("Failed to create broadcast: %v", clientErr)
	}

	// Extract the broadcast ID from the response
	broadcastID := ""
	if response != nil && response.Data.GetId() != nil {
		broadcastID = *response.Data.GetId()
	}

	if broadcastID == "" {
		log.Fatal("Failed to get broadcast ID from response")
	}

	// Write the broadcast ID to the output log file
	logContent := fmt.Sprintf("Broadcast ID: %s", broadcastID)
	writeErr := os.WriteFile("/home/user/project/output.log", []byte(logContent), 0644)
	if writeErr != nil {
		log.Fatalf("Failed to write output log: %v", writeErr)
	}

	fmt.Printf("Broadcast created successfully. %s\n", logContent)
}