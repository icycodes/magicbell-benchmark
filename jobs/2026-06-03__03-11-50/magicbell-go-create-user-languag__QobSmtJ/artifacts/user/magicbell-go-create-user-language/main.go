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
	runID := os.Getenv("ZEALT_RUN_ID")
	email := os.Getenv("MAGICBELL_EMAIL")
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")

	if runID == "" || email == "" || projectToken == "" {
		log.Fatal("Missing required environment variables")
	}

	cfg := clientconfig.NewConfig()
	cfg.SetAccessToken(projectToken)
	
	mbClient := client.NewClient(cfg)

	externalID := fmt.Sprintf("user-%s", runID)
	userEmail := fmt.Sprintf("%s+%s@gmail.com", email, runID)

	customAttrs := map[string]interface{}{
		"language": "es",
	}

	userReq := shared.User{
		ExternalId: &util.Nullable[string]{Value: externalID},
		Email:      &util.Nullable[string]{Value: userEmail},
		CustomAttributes: &util.Nullable[any]{Value: customAttrs},
	}

	ctx := context.Background()
	resp, errObj := mbClient.Users.SaveUser(ctx, userReq)
	if errObj != nil {
		log.Fatalf("Error creating user: %v", errObj.Error())
	}

	if resp.Data.Id == nil {
		log.Fatal("User ID is nil in response")
	}

	userID := *resp.Data.Id

	logFile := "/home/user/magicbell-go-create-user-language/output.log"
	f, err := os.Create(logFile)
	if err != nil {
		log.Fatalf("Error creating log file: %v", err)
	}
	defer f.Close()

	_, err = f.WriteString(fmt.Sprintf("User ID: %s\n", userID))
	if err != nil {
		log.Fatalf("Error writing to log file: %v", err)
	}

	fmt.Printf("Successfully created user with ID: %s\n", userID)
}
