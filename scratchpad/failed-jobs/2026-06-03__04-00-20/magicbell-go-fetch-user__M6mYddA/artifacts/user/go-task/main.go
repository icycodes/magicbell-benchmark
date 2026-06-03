package main

import (
	"context"
	"flag"
	"fmt"
	"os"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/users"
)

func main() {
	externalID := flag.String("external-id", "", "The external ID of the user to fetch")
	flag.Parse()

	if *externalID == "" {
		fmt.Fprintln(os.Stderr, "Error: --external-id is required")
		flag.Usage()
		os.Exit(1)
	}

	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		fmt.Fprintln(os.Stderr, "Error: MAGICBELL_PROJECT_TOKEN environment variable is required")
		os.Exit(1)
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)

	sdkClient := client.NewClient(config)

	params := users.ListUsersRequestParams{}
	params.SetQuery(*externalID)

	response, err := sdkClient.Users.ListUsers(context.Background(), params)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error fetching users: %v\n", err)
		os.Exit(1)
	}

	userCollection := response.GetData()
	foundUsers := userCollection.GetData()

	// Search for a user with a matching external_id
	for i := range foundUsers {
		u := &foundUsers[i]
		extID := u.GetExternalId()
		if extID != nil && !extID.IsNull && extID.Value == *externalID {
			email := u.GetEmail()
			if email != nil && !email.IsNull {
				fmt.Println(email.Value)
			} else {
				fmt.Println("")
			}
			return
		}
	}

	// If no exact match on external_id, print the first result's email
	// (the query may have matched on other fields)
	if len(foundUsers) > 0 {
		u := &foundUsers[0]
		email := u.GetEmail()
		if email != nil && !email.IsNull {
			fmt.Println(email.Value)
		} else {
			fmt.Println("")
		}
		return
	}

	fmt.Fprintln(os.Stderr, "Error: user not found")
	os.Exit(1)
}