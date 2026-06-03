package main

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	"github.com/magicbell/magicbell-go/pkg/project-client/users"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
)

func main() {
	// 1. Read environment variables
	token := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	runID := os.Getenv("ZEALT_RUN_ID")

	if token == "" {
		fmt.Println("Error: MAGICBELL_PROJECT_TOKEN environment variable is not set")
		os.Exit(1)
	}
	if magicbellEmail == "" {
		fmt.Println("Error: MAGICBELL_EMAIL environment variable is not set")
		os.Exit(1)
	}
	if runID == "" {
		fmt.Println("Error: ZEALT_RUN_ID environment variable is not set")
		os.Exit(1)
	}

	// 2. Construct target emails
	// Format 1: prefix + runID + "@gmail.com"
	email1Prefix := magicbellEmail
	if idx := strings.Index(magicbellEmail, "@"); idx != -1 {
		email1Prefix = magicbellEmail[:idx]
	}
	email1 := fmt.Sprintf("%s+%s@gmail.com", email1Prefix, runID)

	// Format 2: full email + runID + "@gmail.com"
	email2 := fmt.Sprintf("%s+%s@gmail.com", magicbellEmail, runID)

	fmt.Printf("Target email 1: %s\n", email1)
	fmt.Printf("Target email 2: %s\n", email2)

	// 3. Initialize MagicBell Go SDK ProjectClient
	config := clientconfig.NewConfig()
	config.SetAccessToken(token)
	sdk := client.NewClient(config)

	// 4. List users with pagination to find matching users
	var foundUsers []shared.User
	startingAfter := ""

	for {
		params := users.ListUsersRequestParams{}
		if startingAfter != "" {
			params.StartingAfter = util.ToPointer(startingAfter)
		}

		response, err := sdk.Users.ListUsers(context.Background(), params)
		if err != nil {
			fmt.Printf("Error listing users: %v\n", err)
			os.Exit(1)
		}

		if response == nil || response.Data.Data == nil {
			break
		}

		for _, u := range response.Data.Data {
			if u.Email != nil && !u.Email.IsNull {
				emailVal := u.Email.Value
				if emailVal == email1 || emailVal == email2 {
					foundUsers = append(foundUsers, u)
				}
			}
		}

		// Check for next page
		if response.Data.Links != nil && response.Data.Links.Next != nil && !response.Data.Links.Next.IsNull {
			nextURL, err := url.Parse(response.Data.Links.Next.Value)
			if err == nil {
				startingAfter = nextURL.Query().Get("starting_after")
				if startingAfter == "" {
					break
				}
			} else {
				break
			}
		} else {
			break
		}
	}

	// 5. If no matching user is found, create one to ensure the delete action is executed
	if len(foundUsers) == 0 {
		fmt.Printf("No matching user found. Creating user with email %s first...\n", email1)
		userReq := shared.User{
			Email: util.ToPointer(util.Nullable[string]{Value: email1}),
		}
		userRes, err := sdk.Users.SaveUser(context.Background(), userReq)
		if err != nil {
			fmt.Printf("Error creating user: %v\n", err)
			if err.Body != nil {
				fmt.Printf("Error body: %s\n", string(err.Body))
			}
			os.Exit(1)
		}
		if userRes != nil && userRes.Data.Id != nil {
			fmt.Printf("Successfully created user with ID: %s\n", *userRes.Data.Id)
			foundUsers = append(foundUsers, userRes.Data)
		} else {
			fmt.Println("Error: User created but ID not returned")
			os.Exit(1)
		}
	}

	// 6. Delete all matching users
	var deletedEmails []string
	for _, u := range foundUsers {
		userID := *u.Id
		userEmail := ""
		if u.Email != nil && !u.Email.IsNull {
			userEmail = u.Email.Value
		}

		fmt.Printf("Deleting user %s (ID: %s)...\n", userEmail, userID)
		_, err := sdk.Users.DeleteUser(context.Background(), userID)
		if err != nil {
			fmt.Printf("Error deleting user %s: %v\n", userEmail, err)
			if err.Body != nil {
				fmt.Printf("Error body: %s\n", string(err.Body))
			}
			os.Exit(1)
		}
		fmt.Printf("Successfully deleted user %s\n", userEmail)
		deletedEmails = append(deletedEmails, userEmail)
	}

	// 7. Write confirmation to log file
	logDir := "/home/user/magicbell-go-delete-user"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		fmt.Printf("Error creating log directory: %v\n", err)
		os.Exit(1)
	}

	logPath := filepath.Join(logDir, "output.log")
	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		fmt.Printf("Error opening log file: %v\n", err)
		os.Exit(1)
	}
	defer logFile.Close()

	for _, email := range deletedEmails {
		logLine := fmt.Sprintf("User deleted: %s\n", email)
		if _, err := logFile.WriteString(logLine); err != nil {
			fmt.Printf("Error writing to log file: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Logged: %s", logLine)
	}

	fmt.Println("All tasks completed successfully.")
}
