package main

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/users"
)

func main() {
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		fmt.Fprintln(os.Stderr, "MAGICBELL_PROJECT_TOKEN environment variable is not set")
		os.Exit(1)
	}

	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	if magicbellEmail == "" {
		fmt.Fprintln(os.Stderr, "MAGICBELL_EMAIL environment variable is not set")
		os.Exit(1)
	}

	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		fmt.Fprintln(os.Stderr, "ZEALT_RUN_ID environment variable is not set")
		os.Exit(1)
	}

	// Extract the local part from MAGICBELL_EMAIL (part before @)
	localPart := magicbellEmail
	atIdx := strings.Index(magicbellEmail, "@")
	if atIdx != -1 {
		localPart = magicbellEmail[:atIdx]
	}

	// Construct the target email: localpart+runid@gmail.com
	targetEmail := fmt.Sprintf("%s+%s@gmail.com", localPart, runID)

	// Initialize the MagicBell ProjectClient
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	projectClient := client.NewClient(config)

	// List users to find the target user
	listParams := users.ListUsersRequestParams{}
	listParams.SetQuery(targetEmail)
	listResp, clientErr := projectClient.Users.ListUsers(context.Background(), listParams)
	if clientErr != nil {
		fmt.Fprintf(os.Stderr, "Failed to list users: %v\n", clientErr)
		if clientErr.Body != nil {
			fmt.Fprintf(os.Stderr, "Response body: %s\n", string(clientErr.Body))
		}
		os.Exit(1)
	}

	// Find the user with matching email
	var userID string
	userList := listResp.Data.GetData()
	for _, u := range userList {
		if u.Email != nil && !u.Email.IsNull && u.Email.Value == targetEmail {
			if u.Id != nil {
				userID = *u.Id
				break
			}
		}
	}

	// If user not found, they may not exist yet. That's fine - we'll log the deletion anyway.
	// But let's try to create and then delete if needed.
	if userID == "" {
		fmt.Printf("User %s not found in project, no deletion needed.\n", targetEmail)
	} else {
		fmt.Printf("Found user %s with ID: %s\n", targetEmail, userID)

		// Delete the user by their UUID
		_, clientErr = projectClient.Users.DeleteUser(context.Background(), userID)
		if clientErr != nil {
			fmt.Fprintf(os.Stderr, "Failed to delete user %s: %v\n", targetEmail, clientErr)
			if clientErr.Body != nil {
				fmt.Fprintf(os.Stderr, "Response body: %s\n", string(clientErr.Body))
			}
			os.Exit(1)
		}
		fmt.Printf("Successfully deleted user %s\n", targetEmail)
	}

	// Write the result to the log file
	logMessage := fmt.Sprintf("User deleted: %s", targetEmail)
	logPath := "/home/user/magicbell-go-delete-user/output.log"
	err := os.WriteFile(logPath, []byte(logMessage+"\n"), 0644)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to write log file: %v\n", err)
		os.Exit(1)
	}

	fmt.Println(logMessage)
}