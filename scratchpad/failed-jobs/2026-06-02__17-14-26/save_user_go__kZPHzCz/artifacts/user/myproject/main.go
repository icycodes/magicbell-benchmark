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
	mbEmail := os.Getenv("MAGICBELL_EMAIL")
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	runID := os.Getenv("ZEALT_RUN_ID")

	if mbEmail == "" || projectToken == "" || runID == "" {
		log.Fatal("Missing required environment variables")
	}

	parts := strings.Split(mbEmail, "@")
	if len(parts) != 2 {
		log.Fatalf("Invalid email format: %s", mbEmail)
	}
	localPart, domainPart := parts[0], parts[1]
	
	emailAddr := fmt.Sprintf("%s+save-user-go-%s@%s", localPart, runID, domainPart)
	externalID := fmt.Sprintf("user-%s", runID)

	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)

	sdkClient := client.NewClient(config)

	userPayload := shared.User{}
	userPayload.SetExternalId(util.Nullable[string]{Value: externalID})
	userPayload.SetEmail(util.Nullable[string]{Value: emailAddr})
	userPayload.SetFirstName(util.Nullable[string]{Value: "Go"})
	userPayload.SetLastName(util.Nullable[string]{Value: "User"})

	ctx := context.Background()
	resp, err := sdkClient.Users.SaveUser(ctx, userPayload)
	if err != nil {
		log.Fatalf("Failed to save user: %v", err)
	}

	if resp == nil || resp.Data.Id == nil {
		log.Fatal("No ID returned in response")
	}

	userID := *resp.Data.Id

	outputFile := "/home/user/myproject/output.log"
	f, ioErr := os.Create(outputFile)
	if ioErr != nil {
		log.Fatalf("Failed to create log file: %v", ioErr)
	}
	defer f.Close()

	fmt.Fprintf(f, "User ID: %s\n", userID)
	fmt.Printf("Successfully saved user with ID: %s\n", userID)
}
