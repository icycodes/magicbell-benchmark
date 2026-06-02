package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
	"github.com/magicbell/magicbell-go/pkg/project-client/workflows"
)

func main() {
	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		log.Fatal("ZEALT_RUN_ID environment variable is required")
	}

	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN environment variable is required")
	}

	workflowKey := fmt.Sprintf("wf-save-go-%s", runID)

	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)

	projectClient := client.NewClient(config)

	stepInput := map[string]interface{}{
		"title":   fmt.Sprintf("Workflow Save Go - %s", runID),
		"content": "Hello from Go saved workflow",
	}

	workflowDefinition := workflows.WorkflowDefinition{
		Key: util.ToPointer(workflowKey),
		Steps: []workflows.WorkflowDefinitionSteps{
			{
				Command: util.ToPointer("broadcast"),
				Input:   util.ToPointer(util.Nullable[any]{Value: stepInput}),
			},
		},
	}

	response, err := projectClient.Workflows.SaveWorkflow(context.Background(), workflowDefinition)
	if err != nil {
		log.Fatalf("failed to save workflow: %v", err)
	}

	if response == nil || response.Data.Key == nil {
		log.Fatal("workflow key missing in response")
	}

	savedKey := *response.Data.Key
	logContent := fmt.Sprintf("Workflow Key: %s\n", savedKey)
	if writeErr := os.WriteFile("/home/user/myproject/output.log", []byte(logContent), 0644); writeErr != nil {
		log.Fatalf("failed to write log file: %v", writeErr)
	}

	fmt.Printf("Saved workflow key: %s\n", savedKey)
}
