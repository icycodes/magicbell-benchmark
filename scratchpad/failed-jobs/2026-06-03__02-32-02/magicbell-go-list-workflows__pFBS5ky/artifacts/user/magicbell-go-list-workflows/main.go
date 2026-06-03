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
		fmt.Fprintln(os.Stderr, "MAGICBELL_PROJECT_TOKEN environment variable is not set")
		os.Exit(1)
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(token)

	projectClient := client.NewClient(config)

	response, clientErr := projectClient.Workflows.FetchWorkflows(context.Background())
	if clientErr != nil {
		fmt.Fprintf(os.Stderr, "Error fetching workflows: %v\n", clientErr.Err)
		os.Exit(1)
	}

	for _, workflow := range response.Data.Items {
		if workflow.Key != nil {
			fmt.Println(*workflow.Key)
		}
	}
}
