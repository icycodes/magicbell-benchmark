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
	emailPrefix := os.Getenv("MAGICBELL_EMAIL")
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")

	recipientEmail := fmt.Sprintf("%s+%s@gmail.com", emailPrefix, runID)
	actionURL := fmt.Sprintf("https://example.com/action-%s", runID)

	cfg := clientconfig.NewConfig()
	cfg.SetAccessToken(projectToken)

	c := client.NewClient(cfg)

	title := "Test Broadcast"
	content := "This is a test broadcast content."

	b := broadcasts.Broadcast{}
	b.SetTitle(title)
	b.SetContent(util.Nullable[string]{Value: content})
	b.SetActionUrl(util.Nullable[string]{Value: actionURL})

	u := shared.User{}
	u.SetEmail(util.Nullable[string]{Value: recipientEmail})

	b.SetRecipients(util.Nullable[[]shared.User]{Value: []shared.User{u}})

	resp, err := c.Broadcasts.CreateBroadcast(context.Background(), b)
	if err != nil {
		log.Fatalf("Error creating broadcast: %v", err)
	}

	broadcastID := resp.Data.GetId()
	if broadcastID == nil {
		log.Fatalf("Broadcast ID is nil")
	}

	output := fmt.Sprintf("Broadcast ID: %s\n", *broadcastID)
	writeErr := os.WriteFile("/home/user/project/output.log", []byte(output), 0644)
	if writeErr != nil {
		log.Fatalf("Error writing to file: %v", writeErr)
	}

	fmt.Println("Success!")
}
