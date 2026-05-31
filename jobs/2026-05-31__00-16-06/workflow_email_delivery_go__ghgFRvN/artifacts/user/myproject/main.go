package main

import (
	"context"
	"fmt"
	"os"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
	"github.com/magicbell/magicbell-go/pkg/project-client/workflows"
)

func main() {
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	runID := os.Getenv("ZEALT_RUN_ID")
	gmailUserName := os.Getenv("GMAIL_USER_NAME")

	if projectToken == "" {
		fmt.Fprintf(os.Stderr, "MAGICBELL_PROJECT_TOKEN environment variable is required\n")
		os.Exit(1)
	}
	if runID == "" {
		fmt.Fprintf(os.Stderr, "ZEALT_RUN_ID environment variable is required\n")
		os.Exit(1)
	}
	if gmailUserName == "" {
		fmt.Fprintf(os.Stderr, "GMAIL_USER_NAME environment variable is required\n")
		os.Exit(1)
	}

	workflowKey := fmt.Sprintf("order_notification_%s", runID)

	// Initialize the MagicBell client
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	projectClient := client.NewClient(config)

	// Define the workflow with a single broadcast step
	workflowDef := workflows.WorkflowDefinition{
		Key: util.ToPointer(workflowKey),
		Steps: []workflows.WorkflowDefinitionSteps{
			{
				Command: util.ToPointer("broadcast"),
				Input: &util.Nullable[any]{
					Value: map[string]any{
						"title":  "Order Notification - {{payload.run_id}}",
						"content": "Your order has been updated successfully. Run ID: {{payload.run_id}}",
						"recipients": []any{
							map[string]any{
								"email": "{{payload.email}}",
							},
						},
					},
				},
			},
		},
	}

	// Save the workflow
	ctx := context.Background()
	saveResp, err := projectClient.Workflows.SaveWorkflow(ctx, workflowDef)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to save workflow: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Workflow saved: %+v\n", saveResp.Data)

	// Execute the workflow
	email := fmt.Sprintf("%s+%s@gmail.com", gmailUserName, runID)
	execReq := workflows.ExecuteWorkflowRequest{
		Key: util.ToPointer(workflowKey),
		Input: &util.Nullable[any]{
			Value: map[string]any{
				"run_id": runID,
				"email":  email,
			},
		},
	}

	runResp, err := projectClient.Workflows.CreateWorkflowRun(ctx, execReq)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to create workflow run: %v\n", err)
		os.Exit(1)
	}

	workflowRunID := runResp.Data.GetId()
	fmt.Printf("Workflow Run ID: %s\n", *workflowRunID)
}