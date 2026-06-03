package main

import (
	"context"
	"flag"
	"fmt"
	"os"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
)

func main() {
	externalID := flag.String("external-id", "", "The user's external ID")
	flag.Parse()

	if *externalID == "" {
		fmt.Println("Error: --external-id is required")
		os.Exit(1)
	}

	token := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if token == "" {
		fmt.Println("Error: MAGICBELL_PROJECT_TOKEN environment variable is required")
		os.Exit(1)
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(token)
	
	mbClient := client.NewClient(config)
	
	user := shared.User{}
	user.SetExternalId(util.Nullable[string]{Value: *externalID, IsNull: false})
	
	ctx := context.Background()
	resp, err := mbClient.Users.SaveUser(ctx, user)
	if err != nil {
		fmt.Printf("Error fetching user: %v\n", err)
		os.Exit(1)
	}
	
	email := (&resp.Data).GetEmail()
	if email != nil && !email.IsNull {
		fmt.Println(email.Value)
	}
}
