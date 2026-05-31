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
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	runID := os.Getenv("ZEALT_RUN_ID")
	gmailUser := os.Getenv("GMAIL_USER_NAME")

	if projectToken == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN is required")
	}
	if runID == "" {
		log.Fatal("ZEALT_RUN_ID is required")
	}
	if gmailUser == "" {
		log.Fatal("GMAIL_USER_NAME is required")
	}

	workflowKey := fmt.Sprintf("order_notification_%s", runID)
	workflowEmail := fmt.Sprintf("%s+%s@gmail.com", gmailUser, runID)

	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	sdk := client.NewClient(config)

	stepInput := map[string]any{
		"title":   "Order Notification - {{payload.run_id}}",
		"content": "Your order has been updated successfully. Run ID: {{payload.run_id}}",
		"recipients": []map[string]any{
			{"email": "{{payload.email}}"},
		},
	}

	workflowStep := workflows.WorkflowDefinitionSteps{}
	workflowStep.SetCommand("broadcast")
	workflowStep.SetInput(util.Nullable[any]{Value: stepInput})

	definition := workflows.WorkflowDefinition{}
	definition.SetKey(workflowKey)
	definition.SetSteps([]workflows.WorkflowDefinitionSteps{workflowStep})

	ctx := context.Background()
	if _, err := sdk.Workflows.SaveWorkflow(ctx, definition); err != nil {
		log.Fatalf("failed to save workflow: %v", err)
	}

	runInput := map[string]any{
		"run_id": runID,
		"email":  workflowEmail,
	}

	executeRequest := workflows.ExecuteWorkflowRequest{}
	executeRequest.SetKey(workflowKey)
	executeRequest.SetInput(util.Nullable[any]{Value: runInput})

	runResponse, err := sdk.Workflows.CreateWorkflowRun(ctx, executeRequest)
	if err != nil {
		log.Fatalf("failed to execute workflow: %v", err)
	}
	if runResponse == nil || runResponse.Data.Id == nil {
		log.Fatal("workflow run response missing id")
	}

	fmt.Printf("Workflow Run ID: %s\n", *runResponse.Data.Id)
}
