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
		log.Fatal("ZEALT_RUN_ID environment variable is not set")
	}

	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN environment variable is not set")
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)

	magicbellClient := client.NewClient(config)

	workflowKey := fmt.Sprintf("wf-save-go-%s", runID)
	title := fmt.Sprintf("Workflow Save Go - %s", runID)

	inputData := map[string]interface{}{
		"title":   title,
		"content": "Hello from Go saved workflow",
	}

	inputNullable := util.Nullable[any]{Value: inputData, IsNull: false}

	step := workflows.WorkflowDefinitionSteps{}
	step.SetCommand("broadcast")
	step.SetInput(inputNullable)

	workflowDef := workflows.WorkflowDefinition{}
	workflowDef.SetKey(workflowKey)
	workflowDef.SetSteps([]workflows.WorkflowDefinitionSteps{step})

	resp, clientErr := magicbellClient.Workflows.SaveWorkflow(context.Background(), workflowDef)
	if clientErr != nil {
		log.Fatalf("Failed to save workflow: %v", clientErr)
	}

	savedKey := workflowKey
	if resp != nil && resp.Data.Key != nil {
		savedKey = *resp.Data.Key
	}

	logContent := fmt.Sprintf("Workflow Key: %s\n", savedKey)
	err := os.WriteFile("/home/user/myproject/output.log", []byte(logContent), 0644)
	if err != nil {
		log.Fatalf("Failed to write output log: %v", err)
	}

	fmt.Printf("Workflow saved successfully. Key: %s\n", savedKey)
}
