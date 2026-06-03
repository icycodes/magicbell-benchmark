package main

import (
	"context"
	"fmt"
	"os"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
)

func main() {
	config := clientconfig.NewConfig()
	config.SetAccessToken(os.Getenv("MAGICBELL_PROJECT_TOKEN"))
	
	mbClient := client.NewClient(config)
	
	resp, err := mbClient.Workflows.FetchWorkflows(context.Background())
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
