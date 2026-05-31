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
	runID := os.Getenv("ZEALT_RUN_ID")

	if projectToken == "" || gmailUserName == "" || runID == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN, GMAIL_USER_NAME, and ZEALT_RUN_ID must be set")
	}

	recipientEmail := fmt.Sprintf("%s+%s@gmail.com", gmailUserName, runID)
	title := fmt.Sprintf("Verification Run %s", runID)
	content := fmt.Sprintf("This is a test notification for run %s.", runID)

	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	magicbellClient := client.NewClient(config)

	broadcast := broadcasts.Broadcast{
		Title: util.ToPointer(title),
		Content: &util.Nullable[string]{
			Value: content,
		},
		Recipients: &util.Nullable[[]shared.User]{
			Value: []shared.User{
				{
					Email: &util.Nullable[string]{
						Value: recipientEmail,
					},
				},
			},
		},
	}

	response, err := magicbellClient.Broadcasts.CreateBroadcast(context.Background(), broadcast)
	if err != nil {
		log.Fatalf("failed to create broadcast: %v", err)
	}
	if response == nil || response.Data.Id == nil {
		log.Fatal("broadcast created but no ID returned")
	}

	logPath := "/home/user/myproject/output.log"
	logLine := fmt.Sprintf("Broadcast ID: %s\n", *response.Data.Id)
	if writeErr := os.WriteFile(logPath, []byte(logLine), 0644); writeErr != nil {
		log.Fatalf("failed to write log file: %v", writeErr)
	}
}
