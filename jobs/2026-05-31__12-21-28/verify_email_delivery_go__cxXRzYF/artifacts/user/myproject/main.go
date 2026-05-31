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
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	gmailUserName := os.Getenv("GMAIL_USER_NAME")
	zealtRunID := os.Getenv("ZEALT_RUN_ID")

	if projectToken == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN environment variable is required")
	}
	if gmailUserName == "" {
		log.Fatal("GMAIL_USER_NAME environment variable is required")
	}
	if zealtRunID == "" {
		log.Fatal("ZEALT_RUN_ID environment variable is required")
	}

	// Construct recipient email address
	recipientEmail := fmt.Sprintf("%s+%s@gmail.com", gmailUserName, zealtRunID)

	// Initialize MagicBell client with project token
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	mbClient := client.NewClient(config)

	// Create broadcast request
	title := fmt.Sprintf("Verification Run %s", zealtRunID)
	content := fmt.Sprintf("This is a test notification for run %s.", zealtRunID)

	recipient := shared.User{
		Email: util.ToPointer(util.Nullable[string]{Value: recipientEmail}),
	}

	broadcastReq := broadcasts.Broadcast{
		Title:      util.ToPointer(title),
		Content:    util.ToPointer(util.Nullable[string]{Value: content}),
		Recipients: util.ToPointer(util.Nullable[[]shared.User]{Value: []shared.User{recipient}}),
	}

	// Send the broadcast
	response, clientErr := mbClient.Broadcasts.CreateBroadcast(context.Background(), broadcastReq)
	if clientErr != nil {
		log.Fatalf("Failed to create broadcast: %v", clientErr)
	}

	// Extract broadcast ID
	broadcastID := ""
	if response.Data.Id != nil {
		broadcastID = *response.Data.Id
	}

	if broadcastID == "" {
		log.Fatal("Broadcast ID was not returned in the response")
	}

	// Write broadcast ID to log file
	logContent := fmt.Sprintf("Broadcast ID: %s\n", broadcastID)
	writeErr := os.WriteFile("/home/user/myproject/output.log", []byte(logContent), 0644)
	if writeErr != nil {
		log.Fatalf("Failed to write output.log: %v", writeErr)
	}

	fmt.Printf("Broadcast created successfully. %s", logContent)
}