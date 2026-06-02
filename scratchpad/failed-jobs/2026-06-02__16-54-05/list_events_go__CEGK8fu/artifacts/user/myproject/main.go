package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/magicbell/magicbell-go/pkg/project-client/broadcasts"
	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/events"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
)

func main() {
	// Read environment variables
	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		fmt.Println("ZEALT_RUN_ID is empty or not set")
		os.Exit(1)
	}

	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	if magicbellEmail == "" {
		fmt.Println("MAGICBELL_EMAIL is empty or not set")
		os.Exit(1)
	}

	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		fmt.Println("MAGICBELL_PROJECT_TOKEN is empty or not set")
		os.Exit(1)
	}

	// Construct recipient email
	parts := strings.Split(magicbellEmail, "@")
	if len(parts) != 2 {
		fmt.Printf("Invalid MAGICBELL_EMAIL format: %s\n", magicbellEmail)
		os.Exit(1)
	}
	recipientEmail := fmt.Sprintf("%s+list-events-go-%s@%s", parts[0], runID, parts[1])
	fmt.Printf("Recipient Email: %s\n", recipientEmail)

	// Initialize the SDK Client
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	sdk := client.NewClient(config)

	// Create broadcast
	broadcastTitle := fmt.Sprintf("Events Demo Go - %s", runID)
	broadcastContent := fmt.Sprintf("Triggering a Go SDK events listing demo for run %s", runID)

	recipients := []shared.User{
		{
			Email: util.ToPointer(util.Nullable[string]{Value: recipientEmail}),
		},
	}

	request := broadcasts.Broadcast{
		Title:      util.ToPointer(broadcastTitle),
		Content:    util.ToPointer(util.Nullable[string]{Value: broadcastContent}),
		Recipients: util.ToPointer(util.Nullable[[]shared.User]{Value: recipients}),
	}

	fmt.Printf("Creating broadcast with title: %s\n", broadcastTitle)
	bc, sdkErr := sdk.Broadcasts.CreateBroadcast(context.Background(), request)
	if sdkErr != nil {
		fmt.Printf("Error creating broadcast: %v\n", sdkErr)
		os.Exit(1)
	}
	fmt.Printf("Broadcast created successfully. ID: %s\n", *bc.Data.Id)

	// Poll for matching event
	var matchedEventID string
	maxRetries := 15
	pollInterval := 3 * time.Second

	for i := 1; i <= maxRetries; i++ {
		fmt.Printf("Polling events (Attempt %d/%d)...\n", i, maxRetries)

		params := events.ListEventsRequestParams{
			Limit: util.ToPointer(int64(50)),
		}

		eventCollection, sdkErr := sdk.Events.ListEvents(context.Background(), params)
		if sdkErr != nil {
			fmt.Printf("Error listing events: %v\n", sdkErr)
			time.Sleep(pollInterval)
			continue
		}

		if len(eventCollection.Data.Data) > 0 {
			firstEvent := eventCollection.Data.Data[0]
			fmt.Printf("Attempt %d: Newest event in list: ID=%s, Type=%s, Timestamp=%s\n", i, *firstEvent.Id, *firstEvent.Type_, *firstEvent.Timestamp)
			for idx, event := range eventCollection.Data.Data {
				if idx < 5 {
					eventBytes, _ := json.Marshal(event)
					fmt.Printf("  Event %d: ID=%s, JSON=%s\n", idx, *event.Id, string(eventBytes))
				}
			}
		} else {
			fmt.Printf("Attempt %d: No events returned\n", i)
		}

		for idx, event := range eventCollection.Data.Data {
			// Only fetch full details for the first 15 events to avoid rate limits
			if idx >= 15 {
				break
			}

			if event.Id == nil {
				continue
			}

			fullEventResp, sdkErr := sdk.Events.FetchEvent(context.Background(), *event.Id)
			if sdkErr != nil {
				fmt.Printf("  Error fetching event %s: %v\n", *event.Id, sdkErr)
				continue
			}

			fullEvent := fullEventResp.Data
			eventBytes, marshalErr := json.Marshal(fullEvent)
			if marshalErr != nil {
				continue
			}

			eventStr := string(eventBytes)

			// Check if the event JSON contains the broadcast title
			if strings.Contains(eventStr, broadcastTitle) {
				matchedEventID = *event.Id
				fmt.Printf("  Found match in fetched event %s!\n", *event.Id)
				break
			}
		}

		if matchedEventID != "" {
			fmt.Printf("Matched Event found! ID: %s\n", matchedEventID)
			break
		}

		time.Sleep(pollInterval)
	}

	if matchedEventID == "" {
		fmt.Println("Error: Failed to find matching event in the log after polling")
		os.Exit(1)
	}

	// Write to output.log
	outputPath := "/home/user/myproject/output.log"
	outputContent := fmt.Sprintf("Event ID: %s\n", matchedEventID)
	err := os.WriteFile(outputPath, []byte(outputContent), 0644)
	if err != nil {
		fmt.Printf("Error writing to output.log: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Successfully wrote Event ID to %s\n", outputPath)
}
