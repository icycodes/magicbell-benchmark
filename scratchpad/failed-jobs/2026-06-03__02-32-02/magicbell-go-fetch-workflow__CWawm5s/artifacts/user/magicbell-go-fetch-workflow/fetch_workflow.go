package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "Usage: fetch_workflow <workflow_key>")
		os.Exit(1)
	}

	workflowKey := os.Args[1]

	token := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if token == "" {
		fmt.Fprintln(os.Stderr, "MAGICBELL_PROJECT_TOKEN environment variable is not set")
		os.Exit(1)
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(token)

	magicbellClient := client.NewClient(config)

	response, err := magicbellClient.Workflows.FetchWorkflows(context.Background())
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error fetching workflows: %v\n", err)
		os.Exit(1)
	}

	for _, item := range response.Data.GetItems() {
		if item.GetKey() != nil && *item.GetKey() == workflowKey {
			jsonData, err := json.MarshalIndent(item, "", "  ")
			if err != nil {
				fmt.Fprintf(os.Stderr, "Error marshaling workflow to JSON: %v\n", err)
				os.Exit(1)
			}
			fmt.Println(string(jsonData))
			return
		}
	}

	fmt.Println("Workflow not found")
	os.Exit(1)
}
