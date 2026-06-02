package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
	"github.com/magicbell/magicbell-go/pkg/project-client/workflows"
)

func main() {
	// 1. Read required environment variables.
	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		log.Fatal("ZEALT_RUN_ID environment variable is not set")
	}
	email := os.Getenv("MAGICBELL_EMAIL")
	if email == "" {
		log.Fatal("MAGICBELL_EMAIL environment variable is not set")
	}
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN environment variable is not set")
	}

	// 2. Compute the plus-addressed recipient email.
	parts := strings.SplitN(email, "@", 2)
	if len(parts) != 2 {
		log.Fatalf("MAGICBELL_EMAIL is not a valid email address: %s", email)
	}
	recipientEmail := fmt.Sprintf("%s+trigger-go-%s@%s", parts[0], runID, parts[1])
	fmt.Printf("Recipient email: %s\n", recipientEmail)

	// Workflow key derived from run ID.
	workflowKey := fmt.Sprintf("wf-trigger-go-%s", runID)
	fmt.Printf("Workflow key: %s\n", workflowKey)

	// 3. Initialise the MagicBell ProjectClient.
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	magicbellClient := client.NewClient(config)

	ctx := context.Background()

	// 4. Build the broadcast step input (JSON with Liquid template in title).
	stepInputMap := map[string]interface{}{
		"title":   "Trigger Go Run {{ marker }}",
		"content": "This notification was triggered by the MagicBell Go SDK workflow run.",
		"recipients": []map[string]interface{}{
			{"email": recipientEmail},
		},
	}
	stepInputBytes, err := json.Marshal(stepInputMap)
	if err != nil {
		log.Fatalf("Failed to marshal step input: %v", err)
	}

	// Unmarshal into `any` so we can wrap it in util.Nullable[any].
	var stepInputAny any
	if err := json.Unmarshal(stepInputBytes, &stepInputAny); err != nil {
		log.Fatalf("Failed to unmarshal step input to any: %v", err)
	}

	// 5. Build the WorkflowDefinition.
	step := workflows.WorkflowDefinitionSteps{
		Command: util.ToPointer("broadcast"),
		Input:   &util.Nullable[any]{Value: stepInputAny, IsNull: false},
	}

	workflowDef := workflows.WorkflowDefinition{
		Key:   util.ToPointer(workflowKey),
		Steps: []workflows.WorkflowDefinitionSteps{step},
	}

	// 6. Upsert (save) the workflow.
	fmt.Println("Saving workflow...")
	saveResp, saveErr := magicbellClient.Workflows.SaveWorkflow(ctx, workflowDef)
	if saveErr != nil {
		log.Fatalf("SaveWorkflow failed: %v", saveErr)
	}
	fmt.Printf("Workflow saved: %s\n", saveResp.Data.String())

	// 7. Build the workflow run input.
	runInputMap := map[string]interface{}{
		"marker": fmt.Sprintf("trigger-go-%s", runID),
	}
	runInputBytes, err := json.Marshal(runInputMap)
	if err != nil {
		log.Fatalf("Failed to marshal run input: %v", err)
	}

	var runInputAny any
	if err := json.Unmarshal(runInputBytes, &runInputAny); err != nil {
		log.Fatalf("Failed to unmarshal run input to any: %v", err)
	}

	// 8. Trigger a workflow run.
	executeReq := workflows.ExecuteWorkflowRequest{
		Key:   util.ToPointer(workflowKey),
		Input: &util.Nullable[any]{Value: runInputAny, IsNull: false},
	}

	fmt.Println("Creating workflow run...")
	runResp, runErr := magicbellClient.Workflows.CreateWorkflowRun(ctx, executeReq)
	if runErr != nil {
		log.Fatalf("CreateWorkflowRun failed: %v", runErr)
	}

	if runResp.Data.Id == nil {
		log.Fatal("CreateWorkflowRun response missing run ID")
	}
	workflowRunID := *runResp.Data.Id
	fmt.Printf("Workflow run created with ID: %s\n", workflowRunID)

	// 9. Write the run ID to the output log file.
	outputPath := "/home/user/myproject/output.log"
	logLine := fmt.Sprintf("Workflow Run ID: %s\n", workflowRunID)
	if err := os.WriteFile(outputPath, []byte(logLine), 0644); err != nil {
		log.Fatalf("Failed to write output log: %v", err)
	}
	fmt.Printf("Run ID written to %s\n", outputPath)
}
