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
	// Read environment variables
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN environment variable is not set")
	}

	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		log.Fatal("ZEALT_RUN_ID environment variable is not set")
	}

	baseEmail := os.Getenv("MAGICBELL_EMAIL")
	if baseEmail == "" {
		log.Fatal("MAGICBELL_EMAIL environment variable is not set")
	}

	// Initialize the MagicBell Project Client
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	magicbellClient := client.NewClient(config)

	// Build user fields
	externalID := fmt.Sprintf("user-%s", runID)
	email := fmt.Sprintf("%s+%s@gmail.com", baseEmail, runID)

	// Build custom attributes with language preference
	customAttributes := map[string]interface{}{
		"language": "es",
	}

	// Create the user request
	userRequest := shared.User{
		ExternalId: util.ToPointer(util.Nullable[string]{Value: externalID}),
		Email:      util.ToPointer(util.Nullable[string]{Value: email}),
		CustomAttributes: util.ToPointer(util.Nullable[any]{
			Value: customAttributes,
		}),
	}

	// Save the user via the SDK
	response, err := magicbellClient.Users.SaveUser(context.Background(), userRequest)
	if err != nil {
		log.Fatalf("Failed to create user: %v", err)
	}

	// Extract the user ID from the response
	userID := ""
	if response.Data.Id != nil {
		userID = *response.Data.Id
	}

	fmt.Printf("User created successfully:\n")
	fmt.Printf("  ID:          %s\n", userID)
	fmt.Printf("  ExternalId:  %s\n", externalID)
	fmt.Printf("  Email:       %s\n", email)

	// Write the user ID to the output log file
	outputPath := "/home/user/magicbell-go-create-user-language/output.log"
	logContent := fmt.Sprintf("User ID: %s\n", userID)
	if err := os.WriteFile(outputPath, []byte(logContent), 0644); err != nil {
		log.Fatalf("Failed to write output log: %v", err)
	}

	fmt.Printf("User ID written to %s\n", outputPath)
}
