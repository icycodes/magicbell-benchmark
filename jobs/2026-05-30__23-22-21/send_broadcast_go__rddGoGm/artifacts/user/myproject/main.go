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
	runID := os.Getenv("ZEALT_RUN_ID")
	gmailUser := os.Getenv("GMAIL_USER_NAME")
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")

	if runID == "" || gmailUser == "" || projectToken == "" {
		log.Fatal("Missing required environment variables")
	}

	recipientEmail := fmt.Sprintf("%s+%s@gmail.com", gmailUser, runID)
	title := fmt.Sprintf("Alert: System Event %s", runID)
	content := fmt.Sprintf("A system event has occurred in run %s", runID)

	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	
	sdk := client.NewClient(config)

	broadcast := broadcasts.Broadcast{
		Title: util.ToPointer(title),
		Content: util.ToPointer(util.Nullable[string]{
			Value: content,
		}),
		Recipients: util.ToPointer(util.Nullable[[]shared.User]{
			Value: []shared.User{
				{
					Email: util.ToPointer(util.Nullable[string]{
						Value: recipientEmail,
					}),
				},
			},
		}),
	}

	ctx := context.Background()
	resp, errObj := sdk.Broadcasts.CreateBroadcast(ctx, broadcast)
	if errObj != nil {
		log.Fatalf("Error creating broadcast: %v", errObj.Error())
	}

	broadcastID := *resp.Data.Id

	logFile, err := os.OpenFile("output.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("Failed to open log file: %v", err)
	}
	defer logFile.Close()

	output := fmt.Sprintf("Broadcast ID: %s\nRecipient: %s\n", broadcastID, recipientEmail)
	if _, err := logFile.WriteString(output); err != nil {
		log.Fatalf("Failed to write to log file: %v", err)
	}

	fmt.Println("Broadcast sent successfully.")
}
