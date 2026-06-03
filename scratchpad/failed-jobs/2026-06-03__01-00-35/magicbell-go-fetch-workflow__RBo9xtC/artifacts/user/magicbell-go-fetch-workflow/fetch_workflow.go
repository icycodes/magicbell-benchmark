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
		fmt.Fprintln(os.Stderr, "Usage: go run fetch_workflow.go <workflow_key>")
		os.Exit(1)
	}

	workflowKey := os.Args[1]

	token := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if token == "" {
		fmt.Fprintln(os.Stderr, "Error: MAGICBELL_PROJECT_TOKEN environment variable is not set")
		os.Exit(1)
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(token)
	sdkClient := client.NewClient(config)

	ctx := context.Background()
	response, err := sdkClient.Workflows.FetchWorkflows(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error fetching workflows: %v\n", err)
		os.Exit(1)
	}

	if response == nil {
		fmt.Fprintln(os.Stderr, "Error: received empty response from SDK")
		os.Exit(1)
	}

	found := false
	for _, item := range response.Data.Items {
		if item.GetKey() != nil && *item.GetKey() == workflowKey {
			found = true
			jsonData, marshalErr := json.MarshalIndent(item, "", "  ")
			if marshalErr != nil {
				fmt.Fprintf(os.Stderr, "Error marshaling workflow: %v\n", marshalErr)
				os.Exit(1)
			}
			fmt.Println(string(jsonData))
			break
		}
	}

	if !found {
		fmt.Println("Workflow not found")
		os.Exit(1)
	}
}
