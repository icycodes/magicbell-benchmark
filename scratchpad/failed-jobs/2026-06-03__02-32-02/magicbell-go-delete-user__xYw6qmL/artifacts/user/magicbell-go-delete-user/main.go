package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	"github.com/magicbell/magicbell-go/pkg/project-client/users"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
)

func main() {
	// Read required environment variables
	token := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if token == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN environment variable is not set")
	}

	baseEmail := os.Getenv("MAGICBELL_EMAIL")
	if baseEmail == "" {
		log.Fatal("MAGICBELL_EMAIL environment variable is not set")
	}

	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		log.Fatal("ZEALT_RUN_ID environment variable is not set")
	}

	// Construct target email: ${MAGICBELL_EMAIL}+${run-id}@gmail.com
	// e.g. "REDACTED@gmail.com" -> "REDACTED+zr-xyw6qml@gmail.com"
	var localPart string
	for i, c := range baseEmail {
		if c == '@' {
			localPart = baseEmail[:i]
			break
		}
	}
	targetEmail := fmt.Sprintf("%s+%s@gmail.com", localPart, runID)

	// Initialize the MagicBell ProjectClient
	config := clientconfig.NewConfig()
	config.SetAccessToken(token)

	magicbellClient := client.NewClient(config)
	ctx := context.Background()

	// Step 1: Upsert the user (create if not exists)
	newUser := shared.User{}
	emailNullable := util.Nullable[string]{Value: targetEmail}
	newUser.SetEmail(emailNullable)

	saveResp, saveErr := magicbellClient.Users.SaveUser(ctx, newUser)
	if saveErr != nil {
		log.Fatalf("Failed to save user %s: %v (status: %d, body: %s)", targetEmail, saveErr, saveErr.Metadata.StatusCode, string(saveErr.Body))
	}

	savedUser := saveResp.Data
	userID := ""
	if savedUser.GetId() != nil {
		userID = *savedUser.GetId()
	}

	if userID == "" {
		// Fall back: search for the user by email
		params := users.ListUsersRequestParams{}
		params.SetQuery(targetEmail)

		listResp, listErr := magicbellClient.Users.ListUsers(ctx, params)
		if listErr != nil {
			log.Fatalf("Failed to list users: %v (status: %d, body: %s)", listErr, listErr.Metadata.StatusCode, string(listErr.Body))
		}

		userData := listResp.Data.GetData()
		for _, u := range userData {
			emailField := u.GetEmail()
			if emailField != nil && !emailField.IsNull && emailField.Value == targetEmail {
				if u.GetId() != nil {
					userID = *u.GetId()
					break
				}
			}
		}
	}

	if userID == "" {
		log.Fatalf("Could not obtain user ID for email %s", targetEmail)
	}

	// Step 2: Delete the user by their UUID
	_, apiErr := magicbellClient.Users.DeleteUser(ctx, userID)
	if apiErr != nil {
		log.Fatalf("Failed to delete user %s: %v (status: %d, body: %s)", targetEmail, apiErr, apiErr.Metadata.StatusCode, string(apiErr.Body))
	}

	// Write confirmation to log file
	logMsg := fmt.Sprintf("User deleted: %s\n", targetEmail)

	logPath := "/home/user/magicbell-go-delete-user/output.log"
	if err := os.WriteFile(logPath, []byte(logMsg), 0644); err != nil {
		log.Fatalf("Failed to write log file: %v", err)
	}

	fmt.Print(logMsg)
}
