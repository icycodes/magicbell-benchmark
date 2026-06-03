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

	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		log.Fatal("ZEALT_RUN_ID is not set")
	}

	cfg := clientconfig.NewConfig()
	cfg.SetAccessToken(projectToken)
	magicbellClient := client.NewClient(cfg)

	params := users.ListUsersRequestParams{}
	params.SetLimit(100)
	params.SetQuery(runID)
	
	resp, err := magicbellClient.Users.ListUsers(context.Background(), params)
	if err != nil {
		log.Fatalf("Failed to list users: %v, Body: %s", err.Err, string(err.Body))
	}

	for _, user := range resp.Data.Data {
		var email string
		if user.Email != nil && !user.Email.IsNull {
			email = user.Email.Value
		}
		fmt.Printf("User found: %s\n", email)
	}
}
