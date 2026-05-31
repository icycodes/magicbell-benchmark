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
		log.Fatal("ZEALT_RUN_ID is not set")
	}

	gmailUser := os.Getenv("GMAIL_USER_NAME")
	if gmailUser == "" {
		log.Fatal("GMAIL_USER_NAME is not set")
	}

	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN is not set")
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	mb := client.NewClient(config)

	workflowKey := fmt.Sprintf("lifecycle-%s", runID)
	recipientEmail := fmt.Sprintf("%s+%s@gmail.com", gmailUser, runID)
	broadcastTitle := fmt.Sprintf("Lifecycle Test %s", runID)

	ctx := context.Background()

	// Define broadcast input
	broadcastInput := map[string]interface{}{
		"recipients": []map[string]interface{}{
			{
				"email": recipientEmail,
			},
		},
		"title": broadcastTitle,
	}

	command := "broadcast"

	// Create workflow definition
	def := workflows.WorkflowDefinition{
		Key: &workflowKey,
		Steps: []workflows.WorkflowDefinitionSteps{
			{
				Command: &command,
				Input: &util.Nullable[any]{
					Value: broadcastInput,
				},
			},
		},
	}

	// Save workflow
	_, errResp := mb.Workflows.SaveWorkflow(ctx, def)
	if errResp != nil {
		log.Fatalf("Failed to save workflow: %s", string(*errResp.Data))
	}

	// Execute workflow
	execReq := workflows.ExecuteWorkflowRequest{
		Key: &workflowKey,
	}
	execResp, errResp := mb.Workflows.CreateWorkflowRun(ctx, execReq)
	if errResp != nil {
		log.Fatalf("Failed to execute workflow: %s", string(*errResp.Data))
	}

	runId := *execResp.Data.Id

	// List workflow runs
	runsResp, errResp := mb.Workflows.ListWorkflowRuns(ctx, workflowKey)
	if errResp != nil {
		log.Fatalf("Failed to list workflow runs: %s", string(*errResp.Data))
	}

	found := false
	for _, run := range runsResp.Data.Data {
		if *run.Id == runId {
			found = true
			break
		}
	}

	if !found {
		log.Fatalf("Workflow run %s not found in list", runId)
	}

	// Write to output.log
	output := fmt.Sprintf("Workflow Key: %s\nRun ID: %s\nRecipient: %s\n", workflowKey, runId, recipientEmail)
	err := os.WriteFile("/home/user/myproject/output.log", []byte(output), 0644)
	if err != nil {
		log.Fatalf("Failed to write output log: %v", err)
	}

	fmt.Println("Success")
}
