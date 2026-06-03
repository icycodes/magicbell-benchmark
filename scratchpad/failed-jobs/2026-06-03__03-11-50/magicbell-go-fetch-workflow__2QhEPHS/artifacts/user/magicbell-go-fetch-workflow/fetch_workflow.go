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
		fmt.Println("Usage: go run fetch_workflow.go <workflow_key>")
		os.Exit(1)
	}

	workflowKey := os.Args[1]
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		fmt.Println("MAGICBELL_PROJECT_TOKEN environment variable is required")
		os.Exit(1)
	}

	cfg := clientconfig.NewConfig()
	cfg.SetAccessToken(projectToken)
	c := client.NewClient(cfg)

	ctx := context.Background()

	workflowsRes, err := c.Workflows.FetchWorkflows(ctx)
	if err != nil {
		fmt.Printf("Error fetching workflows: %v\n", err)
		os.Exit(1)
	}

	if workflowsRes == nil {
		fmt.Println("Workflow not found")
		os.Exit(1)
	}

	for _, wf := range workflowsRes.Data.Items {
		if wf.Key != nil && *wf.Key == workflowKey {
			b, errMarshal := json.MarshalIndent(wf, "", "  ")
			if errMarshal != nil {
				fmt.Printf("Error marshaling workflow: %v\n", errMarshal)
				os.Exit(1)
			}
			fmt.Println(string(b))
			os.Exit(0)
		}
	}

	fmt.Println("Workflow not found")
	os.Exit(1)
}
