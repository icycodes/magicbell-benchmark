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
	if len(os.Args) != 3 {
		log.Fatalf("Usage: go run update_email.go <external_id> <new_email>")
	}

	externalID := os.Args[1]
	newEmail := os.Args[2]

	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		log.Fatalf("MAGICBELL_PROJECT_TOKEN environment variable is required")
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)

	projectClient := client.NewClient(config)

	user := shared.User{
		ExternalId: util.ToPointer(util.Nullable[string]{Value: externalID}),
		Email:      util.ToPointer(util.Nullable[string]{Value: newEmail}),
	}

	response, err := projectClient.Users.SaveUser(context.Background(), user)
	if err != nil {
		log.Fatalf("Failed to update user: %v", err)
	}

	fmt.Printf("User updated: %s\n", response.Data.Email.Value)
}