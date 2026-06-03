package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/users"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
)

func main() {
	externalID := flag.String("external-id", "", "The external ID of the user to fetch")
	flag.Parse()

	if *externalID == "" {
		log.Fatal("--external-id is required")
	}

	token := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if token == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN environment variable is not set")
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(token)
	c := client.NewClient(config)

	params := users.ListUsersRequestParams{
		Query: util.ToPointer(*externalID),
	}

	response, clientErr := c.Users.ListUsers(context.Background(), params)
	if clientErr != nil {
		log.Fatalf("failed to list users: %v", clientErr.Err)
	}

	if len(response.Data.Data) == 0 {
		log.Fatalf("no user found with external ID: %s", *externalID)
	}

	for _, user := range response.Data.Data {
		if user.ExternalId != nil && user.ExternalId.Value == *externalID {
			if user.Email != nil {
				fmt.Println(user.Email.Value)
			} else {
				fmt.Println("")
			}
			return
		}
	}

	log.Fatalf("no user found with external ID: %s", *externalID)
}
