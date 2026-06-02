package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
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
	runID := os.Getenv("ZEALT_RUN_ID")
	email := os.Getenv("MAGICBELL_EMAIL")
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")

	if runID == "" || email == "" || projectToken == "" {
		log.Fatal("Missing environment variables")
	}

	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		log.Fatal("Invalid email format")
	}
	recipientEmail := fmt.Sprintf("%s+list-events-go-%s@%s", parts[0], runID, parts[1])

	title := fmt.Sprintf("Events Demo Go - %s", runID)
	content := fmt.Sprintf("Triggering a Go SDK events listing demo for run %s", runID)

	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)

	sdk := client.NewClient(config)

	userEmailNullable := util.Nullable[string]{Value: recipientEmail, IsNull: false}
	recipient := shared.User{
		Email: &userEmailNullable,
	}
	recipientsArray := []shared.User{recipient}
	recipientsNullable := util.Nullable[[]shared.User]{Value: recipientsArray, IsNull: false}

	titlePtr := title
	contentNullable := util.Nullable[string]{Value: content, IsNull: false}

	broadcast := broadcasts.Broadcast{
		Title:      &titlePtr,
		Content:    &contentNullable,
		Recipients: &recipientsNullable,
	}

	ctx := context.Background()
	_, err := sdk.Broadcasts.CreateBroadcast(ctx, broadcast)
	if err != nil {
		log.Fatalf("Failed to create broadcast: %v", err)
	}

	fmt.Println("Broadcast created successfully. Polling for events...")

	limit := int64(100)
	params := events.ListEventsRequestParams{
		Limit: &limit,
	}

	maxRetries := 20
	var foundEventID string

	for i := 0; i < maxRetries; i++ {
		time.Sleep(3 * time.Second)

		resp, err := sdk.Events.ListEvents(ctx, params)
		if err != nil {
			log.Printf("Failed to list events: %v", err)
			continue
		}

		if resp == nil {
			continue
		}

		for _, event := range resp.Data.Data {
			eventBytes, jsonErr := json.Marshal(event)
			if jsonErr == nil {
				if strings.Contains(string(eventBytes), title) {
					if event.Id != nil {
						foundEventID = *event.Id
						break
					}
				}
			}
		}

		if foundEventID != "" {
			break
		}
	}

	if foundEventID == "" {
		log.Fatal("Could not find matching event")
	}

	fmt.Printf("Found Event ID: %s\n", foundEventID)

	outputFile := "/home/user/myproject/output.log"
	errWrite := os.WriteFile(outputFile, []byte(fmt.Sprintf("Event ID: %s\n", foundEventID)), 0644)
	if errWrite != nil {
		log.Fatalf("Failed to write output log: %v", errWrite)
	}
}
