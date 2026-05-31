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

	if projectToken == "" || runID == "" || gmailUser == "" {
		log.Fatal("Missing required environment variables: MAGICBELL_PROJECT_TOKEN, ZEALT_RUN_ID, GMAIL_USER_NAME")
	}

	workflowKey := fmt.Sprintf("lifecycle-%s", runID)
	recipientEmail := fmt.Sprintf("%s+%s@gmail.com", gmailUser, runID)
	broadcastTitle := fmt.Sprintf("Lifecycle Test %s", runID)

	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)

	sdk := client.NewClient(config)

	broadcastInput := map[string]any{
		"title": broadcastTitle,
		"recipients": []map[string]any{
			{
				"email": recipientEmail,
			},
		},
	}

	workflowDefinition := workflows.WorkflowDefinition{
		Key: util.ToPointer(workflowKey),
		Steps: []workflows.WorkflowDefinitionSteps{
			{
				Command: util.ToPointer("broadcast"),
				Input: &util.Nullable[any]{
					Value: broadcastInput,
				},
			},
		},
	}

	ctx := context.Background()

	_, saveErr := sdk.Workflows.SaveWorkflow(ctx, workflowDefinition)
	if saveErr != nil {
		log.Fatalf("Failed to save workflow: %v", saveErr)
	}

	executeRequest := workflows.ExecuteWorkflowRequest{
		Key: util.ToPointer(workflowKey),
	}

	createRunResponse, createErr := sdk.Workflows.CreateWorkflowRun(ctx, executeRequest)
	if createErr != nil {
		log.Fatalf("Failed to execute workflow: %v", createErr)
	}

	if createRunResponse == nil || createRunResponse.Data.Id == nil {
		log.Fatal("Workflow run response did not include a run ID")
	}

	workflowRunID := *createRunResponse.Data.Id

	listRunsResponse, listErr := sdk.Workflows.ListWorkflowRuns(ctx, workflowKey)
	if listErr != nil {
		log.Fatalf("Failed to list workflow runs: %v", listErr)
	}

	foundRun := false
	for _, run := range listRunsResponse.Data.Data {
		if run.Id != nil && *run.Id == workflowRunID {
			foundRun = true
			break
		}
	}

	if !foundRun {
		log.Fatalf("Workflow run %s was not found in list response", workflowRunID)
	}

	output := fmt.Sprintf("Workflow Key: %s\nRun ID: %s\nRecipient: %s\n", workflowKey, workflowRunID, recipientEmail)

	if err := os.WriteFile("/home/user/myproject/output.log", []byte(output), 0644); err != nil {
		log.Fatalf("Failed to write output.log: %v", err)
	}
}
