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
	token := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	gmailUser := os.Getenv("GMAIL_USER_NAME")
	runID := os.Getenv("ZEALT_RUN_ID")

	if token == "" || gmailUser == "" || runID == "" {
		log.Fatal("Missing environment variables")
	}

	email := fmt.Sprintf("%s+%s@gmail.com", gmailUser, runID)
	title := fmt.Sprintf("Verification Run %s", runID)
	content := fmt.Sprintf("This is a test notification for run %s.", runID)

	config := clientconfig.NewConfig()
	config.SetAccessToken(token)
	c := client.NewClient(config)

	req := broadcasts.Broadcast{
		Title: util.ToPointer(title),
		Content: util.ToPointer(util.Nullable[string]{Value: content}),
		Recipients: util.ToPointer(util.Nullable[[]shared.User]{
			Value: []shared.User{
				{
					Email: util.ToPointer(util.Nullable[string]{Value: email}),
				},
			},
		}),
	}

	resp, err := c.Broadcasts.CreateBroadcast(context.Background(), req)
	if err != nil {
		log.Fatalf("Failed to create broadcast: %v", err)
	}

	output := fmt.Sprintf("Broadcast ID: %s\n", *resp.Data.Id)

	writeErr := os.WriteFile("/home/user/myproject/output.log", []byte(output), 0644)
	if writeErr != nil {
		log.Fatalf("Failed to write to log file: %v", writeErr)
	}
}
