package main

import (
	"context"
	"fmt"
	"os"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
)

func main() {
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		fmt.Fprintln(os.Stderr, "MAGICBELL_PROJECT_TOKEN environment variable is not set")
		os.Exit(1)
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)

	magicbellClient := client.NewClient(config)

	response, err := magicbellClient.Workflows.FetchWorkflows(context.Background())
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error fetching workflows: %v\n", err)
		os.Exit(1)
	}

	workflowList := response.GetData()
	items := workflowList.GetItems()

	for _, item := range items {
		key := item.GetKey()
		if key != nil {
			fmt.Println(*key)
		}
	}
}