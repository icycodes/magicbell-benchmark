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

	var startingAfter *string
	count := 0

	for {
		params := users.ListUsersRequestParams{}
		params.SetLimit(100)
		if startingAfter != nil {
			params.SetStartingAfter(*startingAfter)
		}
		
		resp, err := magicbellClient.Users.ListUsers(context.Background(), params)
		if err != nil {
			log.Fatalf("Failed to list users: %v", err.Err)
		}

		userList := resp.Data.Data
		if len(userList) == 0 {
			break
		}

		for _, user := range userList {
			count++
			var email string
			if user.Email != nil && !user.Email.IsNull {
				email = user.Email.Value
			}
			fmt.Printf("User %d: %s\n", count, email)
			startingAfter = user.Id
		}
	}
}
