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
	// Read environment variables
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN environment variable is not set")
	}

	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	if magicbellEmail == "" {
		log.Fatal("MAGICBELL_EMAIL environment variable is not set")
	}

	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		log.Fatal("ZEALT_RUN_ID environment variable is not set")
	}

	// Build sub-addressed email: <local>+save-user-go-<run-id>@<domain>
	parts := strings.SplitN(magicbellEmail, "@", 2)
	if len(parts) != 2 {
		log.Fatalf("MAGICBELL_EMAIL has unexpected format: %s", magicbellEmail)
	}
	local := parts[0]
	domain := parts[1]
	email := fmt.Sprintf("%s+save-user-go-%s@%s", local, runID, domain)

	// Build external ID
	externalID := fmt.Sprintf("user-%s", runID)

	// Construct the ProjectClient
	cfg := clientconfig.NewConfig()
	cfg.SetAccessToken(projectToken)
	sdk := client.NewClient(cfg)

	// Build the User payload using util.Nullable for string fields
	user := shared.User{}
	user.SetExternalId(util.Nullable[string]{Value: externalID})
	user.SetEmail(util.Nullable[string]{Value: email})
	user.SetFirstName(util.Nullable[string]{Value: "Go"})
	user.SetLastName(util.Nullable[string]{Value: "SDK"})

	// Call SaveUser
	ctx := context.Background()
	resp, clientErr := sdk.Users.SaveUser(ctx, user)
	if clientErr != nil {
		log.Fatalf("SaveUser failed: %v", clientErr)
	}

	// Extract the MagicBell user ID
	if resp == nil || resp.Data.Id == nil {
		log.Fatal("SaveUser returned nil or missing user ID")
	}
	userID := *resp.Data.Id

	// Write output.log
	logContent := fmt.Sprintf("User ID: %s\n", userID)
	err := os.WriteFile("/home/user/myproject/output.log", []byte(logContent), 0644)
	if err != nil {
		log.Fatalf("Failed to write output.log: %v", err)
	}

	fmt.Printf("User saved successfully. MagicBell user ID: %s\n", userID)
	fmt.Printf("Email: %s\n", email)
	fmt.Printf("ExternalId: %s\n", externalID)
	fmt.Println("Log written to /home/user/myproject/output.log")
}
