package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
)

func main() {
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
	magicbellClient := client.NewClient(config)

	externalID := fmt.Sprintf("user-%s", runID)
	email := fmt.Sprintf("%s+%s@gmail.com", baseEmail, runID)

	// Create the user request with custom attributes including language preference
	userRequest := shared.User{
		ExternalId: util.ToPointer(util.Nullable[string]{Value: externalID}),
		Email:      util.ToPointer(util.Nullable[string]{Value: email}),
		CustomAttributes: util.ToPointer(util.Nullable[any]{
			Value: map[string]string{
				"language": "es",
			},
		}),
	}

	// Save the user
	response, err := magicbellClient.Users.SaveUser(context.Background(), userRequest)
	if err != nil {
		log.Fatalf("Failed to create user: %v", err)
	}

	// Get the user ID from the response
	userID := ""
	if response.Data.Id != nil {
		userID = *response.Data.Id
	}

	// Write the user ID to the log file
	logDir := "/home/user/magicbell-go-create-user-language"
	logPath := logDir + "/output.log"

	logContent := fmt.Sprintf("User ID: %s\n", userID)
	if err := os.WriteFile(logPath, []byte(logContent), 0644); err != nil {
		log.Fatalf("Failed to write log file: %v", err)
	}

	fmt.Printf("User created successfully. User ID: %s\n", userID)
}