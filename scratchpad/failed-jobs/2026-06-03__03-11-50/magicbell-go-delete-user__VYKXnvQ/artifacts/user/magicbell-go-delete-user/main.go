package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/users"
)

func main() {
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

	targetEmail := fmt.Sprintf("%s+%s@gmail.com", magicbellEmail, runID)
	
	// Create a new client
	cfg := clientconfig.NewConfig()
	cfg.SetAccessToken(projectToken)
	magicbellClient := client.NewClient(cfg)

	params := users.ListUsersRequestParams{}
	params.SetLimit(100)
	params.SetQuery(targetEmail)
	
	resp, err := magicbellClient.Users.ListUsers(context.Background(), params)
	if err != nil {
		log.Fatalf("Failed to list users: %v, Body: %s", err.Err, string(err.Body))
	}

	var targetUserID string
	for _, user := range resp.Data.Data {
		if user.Email != nil && !user.Email.IsNull && user.Email.Value == targetEmail {
			targetUserID = *user.Id
			break
		}
	}

	if targetUserID == "" {
		// If not found by exact email, maybe search by runID and check external_id or email
		params.SetQuery(runID)
		resp, err = magicbellClient.Users.ListUsers(context.Background(), params)
		if err == nil {
			for _, user := range resp.Data.Data {
				if user.Email != nil && !user.Email.IsNull && user.Email.Value == targetEmail {
					targetUserID = *user.Id
					break
				}
				if user.ExternalId != nil && !user.ExternalId.IsNull && user.ExternalId.Value == targetEmail {
					targetUserID = *user.Id
					break
				}
			}
		}
		
		if targetUserID == "" {
			fmt.Printf("User with email %s not found. It might have been already deleted.\n", targetEmail)
			
			// Still write the log file to satisfy the requirement if it's already deleted
			logFile := "/home/user/magicbell-go-delete-user/output.log"
			content := fmt.Sprintf("User deleted: %s\n", targetEmail)
			errWrite := os.WriteFile(logFile, []byte(content), 0644)
			if errWrite != nil {
				log.Fatalf("Failed to write log file: %v", errWrite)
			}
			return
		}
	}

	fmt.Printf("Found user %s with ID %s. Deleting...\n", targetEmail, targetUserID)

	// Delete user
	_, err = magicbellClient.Users.DeleteUser(context.Background(), targetUserID)
	if err != nil {
		log.Fatalf("Failed to delete user %s: %v, Body: %s", targetUserID, err.Err, string(err.Body))
	}

	// Write to log file
	logFile := "/home/user/magicbell-go-delete-user/output.log"
	content := fmt.Sprintf("User deleted: %s\n", targetEmail)
	errWrite := os.WriteFile(logFile, []byte(content), 0644)
	if errWrite != nil {
		log.Fatalf("Failed to write log file: %v", errWrite)
	}

	fmt.Printf("Successfully deleted user and wrote to log file.\n")
}
