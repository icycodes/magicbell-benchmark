package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
)

func main() {
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	cfg := clientconfig.NewConfig()
	cfg.SetAccessToken(projectToken)
	magicbellClient := client.NewClient(cfg)

	// try a simple email
	userID := "email:test-2@example.com"

	_, err := magicbellClient.Users.DeleteUser(context.Background(), userID)
	if err != nil {
		log.Fatalf("Failed to delete user: %v, Body: %s", err.Err, string(err.Body))
	}

	fmt.Printf("Successfully deleted user.\n")
}
