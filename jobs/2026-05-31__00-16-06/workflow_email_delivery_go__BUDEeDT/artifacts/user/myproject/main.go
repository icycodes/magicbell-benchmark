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
	token := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	runID := os.Getenv("ZEALT_RUN_ID")
	gmailUser := os.Getenv("GMAIL_USER_NAME")

	if token == "" || runID == "" || gmailUser == "" {
		log.Fatal("Missing environment variables")
	}

	workflowKey := fmt.Sprintf("order_notification_%s", runID)
	email := fmt.Sprintf("%s+%s@gmail.com", gmailUser, runID)

	config := clientconfig.NewConfig()
	config.SetAccessToken(token)
	
	mbClient := client.NewClient(config)

	command := "broadcast"
	
	saveReq := workflows.WorkflowDefinition{
		Key: &workflowKey,
		Steps: []workflows.WorkflowDefinitionSteps{
			{
				Command: &command,
				Input: &util.Nullable[any]{
					Value: map[string]interface{}{
						"title":   "Order Notification - {{payload.run_id}}",
						"content": "Your order has been updated successfully. Run ID: {{payload.run_id}}",
						"recipients": []map[string]interface{}{
							{"email": "{{payload.email}}"},
						},
					},
				},
			},
		},
	}

	_, err := mbClient.Workflows.SaveWorkflow(context.Background(), saveReq)
	if err != nil {
		log.Fatalf("Failed to save workflow: %v", err)
	}

	triggerReq := workflows.ExecuteWorkflowRequest{
		Key: &workflowKey,
		Input: &util.Nullable[any]{
			Value: map[string]interface{}{
				"run_id": runID,
				"email":  email,
			},
		},
	}

	runRes, err := mbClient.Workflows.CreateWorkflowRun(context.Background(), triggerReq)
	if err != nil {
		log.Fatalf("Failed to trigger workflow: %v", err)
	}

	fmt.Printf("Workflow Run ID: %s\n", *runRes.Data.Id)
}
