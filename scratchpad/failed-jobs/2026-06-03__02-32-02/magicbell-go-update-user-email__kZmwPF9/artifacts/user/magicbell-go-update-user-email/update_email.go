package main

import (
	"context"
	"fmt"
	"os"

	magicbell "github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Fprintln(os.Stderr, "Usage: go run update_email.go <external_id> <new_email>")
		os.Exit(1)
	}

	externalID := os.Args[1]
	newEmail := os.Args[2]

	token := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if token == "" {
		fmt.Fprintln(os.Stderr, "Error: MAGICBELL_PROJECT_TOKEN environment variable is not set")
		os.Exit(1)
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(token)

	client := magicbell.NewClient(config)

	userRequest := shared.User{
		ExternalId: &util.Nullable[string]{Value: externalID},
		Email:      &util.Nullable[string]{Value: newEmail},
	}

	_, err := client.Users.SaveUser(context.Background(), userRequest)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error updating user: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("User updated: %s\n", newEmail)
}
