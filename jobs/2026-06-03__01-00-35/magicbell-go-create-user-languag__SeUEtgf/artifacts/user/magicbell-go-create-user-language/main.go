package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
)

func main() {
	// Read env vars
	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		log.Fatal("ZEALT_RUN_ID environment variable is required")
	}

	baseEmail := os.Getenv("MAGICBELL_EMAIL")
	if baseEmail == "" {
		log.Fatal("MAGICBELL_EMAIL environment variable is required")
	}

	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN environment variable is required")
	}

	// Initialize the MagicBell Project Client
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	cl := client.NewClient(config)

	// Prepare user parameters
	externalID := "user-" + runID
	email := fmt.Sprintf("%s+%s@gmail.com", baseEmail, runID)

	customAttributesVal := util.Nullable[any]{
		Value: map[string]any{
			"language": "es",
		},
		IsNull: false,
	}

	request := shared.User{
		ExternalId:       util.ToPointer(util.Nullable[string]{Value: externalID, IsNull: false}),
		Email:            util.ToPointer(util.Nullable[string]{Value: email, IsNull: false}),
		CustomAttributes: &customAttributesVal,
	}

	// Save/Create the user
	response, err := cl.Users.SaveUser(context.Background(), request)
	if err != nil {
		log.Fatalf("Error saving user: %v", err)
	}

	createdUser := response.Data
	if createdUser.Id == nil {
		log.Fatal("Created user ID is nil")
	}

	userID := *createdUser.Id
	fmt.Printf("Successfully created user. ID: %s\n", userID)

	// Write the resulting user ID to the log file
	logFilePath := "/home/user/magicbell-go-create-user-language/output.log"
	if err := os.MkdirAll(filepath.Dir(logFilePath), 0755); err != nil {
		log.Fatalf("Error creating log directory: %v", err)
	}

	logContent := fmt.Sprintf("User ID: %s\n", userID)
	if err := os.WriteFile(logFilePath, []byte(logContent), 0644); err != nil {
		log.Fatalf("Error writing to log file: %v", err)
	}

	fmt.Println("Log file written successfully.")
}
