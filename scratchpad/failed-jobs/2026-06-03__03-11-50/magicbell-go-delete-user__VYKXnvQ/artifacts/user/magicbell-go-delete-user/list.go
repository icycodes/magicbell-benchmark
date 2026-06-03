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

	cfg := clientconfig.NewConfig()
	cfg.SetAccessToken(projectToken)
	magicbellClient := client.NewClient(cfg)

	params := users.ListUsersRequestParams{}
	params.SetLimit(100)
	
	resp, err := magicbellClient.Users.ListUsers(context.Background(), params)
	if err != nil {
		log.Fatalf("Failed to list users: %v", err.Err)
	}

	for _, user := range resp.Data.Data {
		var email string
		if user.Email != nil && !user.Email.IsNull {
			email = user.Email.Value
		}
		var id string
		if user.Id != nil {
			id = *user.Id
		}
		fmt.Printf("User ID: %s, Email: %s\n", id, email)
	}
}
