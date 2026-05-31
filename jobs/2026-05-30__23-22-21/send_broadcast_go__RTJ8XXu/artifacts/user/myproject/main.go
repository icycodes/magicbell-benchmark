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
		log.Fatalf("missing required environment variables: ZEALT_RUN_ID, GMAIL_USER_NAME, MAGICBELL_PROJECT_TOKEN")
	}

	recipientEmail := fmt.Sprintf("%s+%s@gmail.com", gmailUser, runID)
	title := fmt.Sprintf("Alert: System Event %s", runID)
	content := fmt.Sprintf("A system event has occurred in run %s", runID)

	sdk := client.NewClient(clientconfig.NewConfig())
	sdk.SetAccessToken(projectToken)

	user := shared.User{
		Email: &util.Nullable[string]{Value: recipientEmail},
	}

	broadcast := broadcasts.Broadcast{
		Title:      util.ToPointer(title),
		Content:    &util.Nullable[string]{Value: content},
		Recipients: &util.Nullable[[]shared.User]{Value: []shared.User{user}},
	}

	response, err := sdk.Broadcasts.CreateBroadcast(context.Background(), broadcast)
	if err != nil {
		log.Fatalf("failed to create broadcast: %v", err)
	}

	broadcastID := ""
	if response != nil && response.Data.Id != nil {
		broadcastID = *response.Data.Id
	}
	if broadcastID == "" {
		log.Fatalf("broadcast created but ID missing from response")
	}

	logContent := fmt.Sprintf("Broadcast ID: %s\nRecipient: %s\n", broadcastID, recipientEmail)
	if writeErr := os.WriteFile("/home/user/myproject/output.log", []byte(logContent), 0o644); writeErr != nil {
		log.Fatalf("failed to write output log: %v", writeErr)
	}
}
