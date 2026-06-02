package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
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
		log.Fatal("MAGICBELL_PROJECT_TOKEN is not set")
	}

	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	if magicbellEmail == "" {
		log.Fatal("MAGICBELL_EMAIL is not set")
	}

	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		log.Fatal("ZEALT_RUN_ID is not set")
	}

	// Split email to form sub-addressed email
	parts := strings.SplitN(magicbellEmail, "@", 2)
	if len(parts) != 2 {
		log.Fatalf("Invalid MAGICBELL_EMAIL: %s", magicbellEmail)
	}
	local := parts[0]
	domain := parts[1]
	email := fmt.Sprintf("%s+save-user-go-%s@%s", local, runID, domain)

	externalID := fmt.Sprintf("user-%s", runID)

	// Create config and client
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	sdk := client.NewClient(config)

	// Build user payload
	userPayload := shared.User{
		ExternalId: util.ToPointer(util.Nullable[string]{Value: externalID}),
		Email:      util.ToPointer(util.Nullable[string]{Value: email}),
		FirstName:  util.ToPointer(util.Nullable[string]{Value: "Go"}),
		LastName:   util.ToPointer(util.Nullable[string]{Value: "SDK"}),
	}

	// Call SaveUser
	response, err := sdk.Users.SaveUser(context.Background(), userPayload)
	if err != nil {
		log.Fatalf("Failed to save user: %v", err)
	}

	if response == nil || response.Data.Id == nil {
		log.Fatal("Failed to get User ID from response")
	}

	userID := *response.Data.Id
	fmt.Printf("Saved user successfully. MagicBell User ID: %s\n", userID)

	// Ensure target directory exists
	logDir := "/home/user/myproject"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		log.Fatalf("Failed to create log directory: %v", err)
	}

	// Write to log file
	logFilePath := filepath.Join(logDir, "output.log")
	logContent := fmt.Sprintf("User ID: %s\n", userID)
	if err := os.WriteFile(logFilePath, []byte(logContent), 0644); err != nil {
		log.Fatalf("Failed to write to log file: %v", err)
	}

	fmt.Printf("Logged User ID to %s\n", logFilePath)
}
