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
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN is not set")
	}

	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	runID := os.Getenv("ZEALT_RUN_ID")
	targetEmail := fmt.Sprintf("%s+%s@gmail.com", magicbellEmail, runID)
	
	cfg := clientconfig.NewConfig()
	cfg.SetAccessToken(projectToken)
	magicbellClient := client.NewClient(cfg)

	user := shared.User{}
	user.SetEmail(util.Nullable[string]{Value: targetEmail, IsNull: false})
	user.SetExternalId(util.Nullable[string]{Value: targetEmail, IsNull: false})

	resp, err := magicbellClient.Users.SaveUser(context.Background(), user)
	if err != nil {
		log.Fatalf("Failed to create user: %v, Body: %s", err.Err, string(err.Body))
	}

	fmt.Printf("Created user with ID: %s, Email: %s\n", *resp.Data.Id, resp.Data.Email.Value)
}
