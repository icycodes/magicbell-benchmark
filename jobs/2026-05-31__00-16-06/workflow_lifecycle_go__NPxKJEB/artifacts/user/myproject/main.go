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
	// Read environment variables
	runID := os.Getenv("ZEALT_RUN_ID")
	gmailUserName := os.Getenv("GMAIL_USER_NAME")
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")

	if runID == "" {
		fmt.Println("ZEALT_RUN_ID environment variable is required")
		os.Exit(1)
	}
	if gmailUserName == "" {
		fmt.Println("GMAIL_USER_NAME environment variable is required")
		os.Exit(1)
	}
	if projectToken == "" {
		fmt.Println("MAGICBELL_PROJECT_TOKEN environment variable is required")
		os.Exit(1)
	}

	// Build the workflow key and recipient email
	workflowKey := fmt.Sprintf("lifecycle-%s", runID)
	recipientEmail := fmt.Sprintf("%s+%s@gmail.com", gmailUserName, runID)
	broadcastTitle := fmt.Sprintf("Lifecycle Test %s", runID)

	// Initialize the MagicBell SDK Project Client
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	sdk := client.NewClient(config)

	ctx := context.Background()

	// Create the broadcast step input
	// The broadcast step input specifies recipients and notification content
	broadcastInput := map[string]interface{}{
		"recipients": []map[string]interface{}{
			{
				"email": recipientEmail,
			},
		},
		"title": broadcastTitle,
	}

	// Create the workflow definition with a single broadcast step
	workflowDefinition := workflows.WorkflowDefinition{
		Key: util.ToPointer(workflowKey),
		Steps: []workflows.WorkflowDefinitionSteps{
			{
				Command: util.ToPointer("broadcast"),
				Input:   &util.Nullable[any]{Value: broadcastInput},
			},
		},
	}

	// Save the workflow definition
	fmt.Printf("Creating workflow with key: %s\n", workflowKey)
	saveResp, err := sdk.Workflows.SaveWorkflow(ctx, workflowDefinition)
	if err != nil {
		fmt.Printf("Error saving workflow: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Workflow saved successfully: %s\n", saveResp.Data.GetKey())

	// Execute the workflow run
	executeReq := workflows.ExecuteWorkflowRequest{
		Key: util.ToPointer(workflowKey),
	}

	fmt.Printf("Executing workflow run for key: %s\n", workflowKey)
	runResp, err := sdk.Workflows.CreateWorkflowRun(ctx, executeReq)
	if err != nil {
		fmt.Printf("Error creating workflow run: %v\n", err)
		os.Exit(1)
	}

	runIDResult := ""
	if runResp.Data.GetId() != nil {
		runIDResult = *runResp.Data.GetId()
	}
	fmt.Printf("Workflow run created with ID: %s\n", runIDResult)

	// Retrieve the runs for this workflow key to verify the run exists
	fmt.Printf("Listing workflow runs for key: %s\n", workflowKey)
	runsResp, err := sdk.Workflows.ListWorkflowRuns(ctx, workflowKey)
	if err != nil {
		fmt.Printf("Error listing workflow runs: %v\n", err)
		os.Exit(1)
	}

	runs := runsResp.Data.GetData()
	fmt.Printf("Found %d workflow run(s)\n", len(runs))
	for i, run := range runs {
		runIDVal := ""
		if run.GetId() != nil {
			runIDVal = *run.GetId()
		}
		fmt.Printf("  Run %d: ID=%s\n", i+1, runIDVal)
	}

	// Write the output log file
	logContent := fmt.Sprintf("Workflow Key: %s\nRun ID: %s\nRecipient: %s\n", workflowKey, runIDResult, recipientEmail)
	writeErr := os.WriteFile("/home/user/myproject/output.log", []byte(logContent), 0644)
	if writeErr != nil {
		fmt.Printf("Error writing output log: %v\n", writeErr)
		os.Exit(1)
	}
	fmt.Printf("Output written to /home/user/myproject/output.log\n")
}