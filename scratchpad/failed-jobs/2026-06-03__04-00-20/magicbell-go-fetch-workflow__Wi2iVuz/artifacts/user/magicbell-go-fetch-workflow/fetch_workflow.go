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
	// Require a workflow key argument
	if len(os.Args) < 2 {
		fmt.Fprintf(os.Stderr, "Usage: %s <workflow_key>\n", os.Args[0])
		os.Exit(1)
	}
	workflowKey := os.Args[1]

	// Read project token from environment variable
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		fmt.Fprintln(os.Stderr, "MAGICBELL_PROJECT_TOKEN environment variable is required")
		os.Exit(1)
	}

	// Initialize the SDK
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	sdk := client.NewClient(config)

	// Fetch all workflows (FetchWorkflow is broken - missing key parameter)
	response, err := sdk.Workflows.FetchWorkflows(context.Background())
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error fetching workflows: %v\n", err)
		os.Exit(1)
	}

	// Find the workflow matching the requested key
	workflowList := response.GetData()
	items := workflowList.GetItems()

	for _, item := range items {
		key := item.GetKey()
		if key != nil && *key == workflowKey {
			// Found the workflow, print as JSON
			jsonData, jsonErr := json.MarshalIndent(item, "", "  ")
			if jsonErr != nil {
				fmt.Fprintf(os.Stderr, "Error marshaling workflow to JSON: %v\n", jsonErr)
				os.Exit(1)
			}
			fmt.Println(string(jsonData))
			return
		}
	}

	// Workflow not found
	fmt.Println("Workflow not found")
	os.Exit(1)
}