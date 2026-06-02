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

	// Initialize the SDK with client.NewClient(clientconfig.NewConfig()) and call config.SetAccessToken(...)
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	cli := client.NewClient(config)

	workflowKey := fmt.Sprintf("wf-save-go-%s", runID)

	// Define input map
	inputMap := map[string]interface{}{
		"title":   fmt.Sprintf("Workflow Save Go - %s", runID),
		"content": "Hello from Go saved workflow",
	}

	// Create workflow definition steps
	step := workflows.WorkflowDefinitionSteps{
		Command: util.ToPointer("broadcast"),
		Input: &util.Nullable[any]{
			Value:  inputMap,
			IsNull: false,
		},
	}

	// Create workflow definition
	workflowDef := workflows.WorkflowDefinition{
		Key:   util.ToPointer(workflowKey),
		Steps: []workflows.WorkflowDefinitionSteps{step},
	}

	ctx := context.Background()
	resp, clientErr := cli.Workflows.SaveWorkflow(ctx, workflowDef)
	if clientErr != nil {
		log.Fatalf("Failed to save workflow: %v, Body: %s", clientErr, string(clientErr.Body))
	}

	savedKey := ""
	if resp.Data.Key != nil {
		savedKey = *resp.Data.Key
	} else {
		log.Fatal("Response did not contain a workflow key")
	}

	// Write the saved workflow key to a log file /home/user/myproject/output.log
	logFilePath := "/home/user/myproject/output.log"
	logContent := fmt.Sprintf("Workflow Key: %s\n", savedKey)
	err := os.WriteFile(logFilePath, []byte(logContent), 0644)
	if err != nil {
		log.Fatalf("Failed to write log file: %v", err)
	}

	fmt.Printf("Successfully saved workflow and wrote key '%s' to %s\n", savedKey, logFilePath)
}
