package main

import (
	"context"
	"fmt"
	"os"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Println("Usage: go run update_email.go <external_id> <new_email>")
		os.Exit(1)
	}

	externalID := os.Args[1]
	newEmail := os.Args[2]

	token := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if token == "" {
		fmt.Println("Error: MAGICBELL_PROJECT_TOKEN environment variable is not set")
		os.Exit(1)
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(token)

	c := client.NewClient(config)

	user := shared.User{}
	user.SetExternalId(util.Nullable[string]{Value: externalID})
	user.SetEmail(util.Nullable[string]{Value: newEmail})

	_, err := c.Users.SaveUser(context.Background(), user)
	if err != nil {
		fmt.Printf("Error updating user: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("User updated: %s\n", newEmail)
}
