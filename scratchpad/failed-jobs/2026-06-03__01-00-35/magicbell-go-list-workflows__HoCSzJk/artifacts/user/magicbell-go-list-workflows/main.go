package main

import (
	"context"
	"fmt"
	"os"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
)

func main() {
	token := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if token == "" {
		fmt.Println("Error: MAGICBELL_PROJECT_TOKEN environment variable is not set")
		os.Exit(1)
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(token)
	sdk := client.NewClient(config)

	resp, err := sdk.Workflows.FetchWorkflows(context.Background())
	if err != nil {
		fmt.Printf("Error fetching workflows: %v\n", err)
		os.Exit(1)
	}

	for _, item := range resp.Data.Items {
		if item.Key != nil {
			fmt.Println(*item.Key)
		}
	}
}
