package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
)

func main() {
	projectToken := strings.TrimSpace(os.Getenv("MAGICBELL_PROJECT_TOKEN"))
	baseEmail := strings.TrimSpace(os.Getenv("MAGICBELL_EMAIL"))
	runID := strings.TrimSpace(os.Getenv("ZEALT_RUN_ID"))

	if projectToken == "" || baseEmail == "" || runID == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN, MAGICBELL_EMAIL, and ZEALT_RUN_ID must be set")
	}

	local, domain, ok := strings.Cut(baseEmail, "@")
	if !ok || local == "" || domain == "" {
		log.Fatalf("invalid MAGICBELL_EMAIL: %s", baseEmail)
	}

	recipientEmail := fmt.Sprintf("%s+save-user-go-%s@%s", local, runID, domain)
	externalID := fmt.Sprintf("user-%s", runID)

	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)

	sdk := client.NewClient(config)

	user := shared.User{
		ExternalId: util.ToPointer(util.Nullable[string]{Value: externalID}),
		Email:      util.ToPointer(util.Nullable[string]{Value: recipientEmail}),
		FirstName:  util.ToPointer(util.Nullable[string]{Value: "Magic"}),
		LastName:   util.ToPointer(util.Nullable[string]{Value: "Bell"}),
	}

	response, err := sdk.Users.SaveUser(context.Background(), user)
	if err != nil {
		log.Fatalf("failed to save user: %v", err.Err)
	}

	if response == nil || response.Data.Id == nil || *response.Data.Id == "" {
		log.Fatal("user id missing from response")
	}

	logLine := fmt.Sprintf("User ID: %s\n", *response.Data.Id)
	if writeErr := os.WriteFile("/home/user/myproject/output.log", []byte(logLine), 0o644); writeErr != nil {
		log.Fatalf("failed to write log file: %v", writeErr)
	}
}
