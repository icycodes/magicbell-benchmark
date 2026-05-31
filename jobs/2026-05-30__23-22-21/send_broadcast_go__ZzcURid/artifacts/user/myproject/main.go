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
	gmailUser := os.Getenv("GMAIL_USER_NAME")
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")

	if runID == "" {
		log.Fatal("ZEALT_RUN_ID environment variable is required")
	}
	if gmailUser == "" {
		log.Fatal("GMAIL_USER_NAME environment variable is required")
	}
	if projectToken == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN environment variable is required")
	}

	// Construct recipient email
	recipientEmail := fmt.Sprintf("%s+%s@gmail.com", gmailUser, runID)

	// Initialize MagicBell ProjectClient
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	sdk := client.NewClient(config)

	// Create broadcast request
	request := broadcasts.Broadcast{
		Title:   util.ToPointer(fmt.Sprintf("Alert: System Event %s", runID)),
		Content: util.ToPointer(util.Nullable[string]{Value: fmt.Sprintf("A system event has occurred in run %s", runID)}),
		Recipients: util.ToPointer(util.Nullable[[]shared.User]{Value: []shared.User{
			{
				Email: util.ToPointer(util.Nullable[string]{Value: recipientEmail}),
			},
		}}),
	}

	// Send broadcast
	response, err := sdk.Broadcasts.CreateBroadcast(context.Background(), request)
	if err != nil {
		log.Fatalf("Failed to create broadcast: %v", err)
	}

	// Extract broadcast ID from response
	broadcastID := ""
	if response.Data.Id != nil {
		broadcastID = *response.Data.Id
	}

	// Write output log
	logContent := fmt.Sprintf("Broadcast ID: %s\nRecipient: %s\n", broadcastID, recipientEmail)
	if err := os.WriteFile("/home/user/myproject/output.log", []byte(logContent), 0644); err != nil {
		log.Fatalf("Failed to write output log: %v", err)
	}

	fmt.Printf("Broadcast created successfully!\n")
	fmt.Printf("Broadcast ID: %s\n", broadcastID)
	fmt.Printf("Recipient: %s\n", recipientEmail)
}