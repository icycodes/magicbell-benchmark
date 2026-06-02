package main

import (
	"context"
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
	// 1. Read environment variables
	runID := os.Getenv("ZEALT_RUN_ID")
	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")

	if runID == "" || magicbellEmail == "" || projectToken == "" {
		log.Fatalf("Missing environment variables: ZEALT_RUN_ID=%q, MAGICBELL_EMAIL=%q, MAGICBELL_PROJECT_TOKEN=%q", runID, magicbellEmail, projectToken)
	}

	fmt.Printf("Read ZEALT_RUN_ID: %s\n", runID)
	fmt.Printf("Read MAGICBELL_EMAIL: %s\n", magicbellEmail)

	// 2. Compute the recipient email
	emailParts := strings.Split(magicbellEmail, "@")
	if len(emailParts) != 2 {
		log.Fatalf("Invalid MAGICBELL_EMAIL format: %s", magicbellEmail)
	}
	local := emailParts[0]
	domain := emailParts[1]
	recipientEmail := fmt.Sprintf("%s+trigger-go-%s@%s", local, runID, domain)
	fmt.Printf("Computed recipient email: %s\n", recipientEmail)

	// 3. Initialize SDK
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	c := client.NewClient(config)

	ctx := context.Background()

	// 4. Upsert workflow definition
	workflowKey := "wf-trigger-go-" + runID
	workflowDef := workflows.WorkflowDefinition{
		Key: util.ToPointer(workflowKey),
		Steps: []workflows.WorkflowDefinitionSteps{
			{
				Command: util.ToPointer("broadcast"),
				Input: &util.Nullable[any]{
					Value: map[string]any{
						"title":   "Trigger Go Run {{ marker }}",
						"content": "This is a broadcast content string from Go SDK",
						"recipients": []map[string]any{
							{
								"email": recipientEmail,
							},
						},
					},
					IsNull: false,
				},
			},
		},
	}

	fmt.Println("Saving workflow...")
	saveResp, saveErr := c.Workflows.SaveWorkflow(ctx, workflowDef)
	if saveErr != nil {
		log.Fatalf("SaveWorkflow failed: %v. Body: %s", saveErr, string(saveErr.Body))
	}
	fmt.Printf("Workflow saved successfully: %s\n", *saveResp.Data.Key)

	// 5. Trigger workflow run
	fmt.Println("Triggering workflow run...")
	runInputMap := map[string]any{
		"marker": "trigger-go-" + runID,
	}
	runInput := &util.Nullable[any]{
		Value:  runInputMap,
		IsNull: false,
	}
	executeReq := workflows.ExecuteWorkflowRequest{
		Key:   util.ToPointer(workflowKey),
		Input: runInput,
	}

	runResp, runErr := c.Workflows.CreateWorkflowRun(ctx, executeReq)
	if runErr != nil {
		log.Fatalf("CreateWorkflowRun failed: %v. Body: %s", runErr, string(runErr.Body))
	}

	if runResp.Data.Id == nil {
		log.Fatalf("Workflow run created, but returned run ID is nil")
	}
	createdRunID := *runResp.Data.Id
	fmt.Printf("Workflow Run ID: %s\n", createdRunID)

	// 6. Write run ID to output.log
	logFilePath := "/home/user/myproject/output.log"
	logContent := fmt.Sprintf("Workflow Run ID: %s\n", createdRunID)
	err := os.WriteFile(logFilePath, []byte(logContent), 0644)
	if err != nil {
		log.Fatalf("Failed to write output log file: %v", err)
	}
	fmt.Printf("Successfully wrote run ID to %s\n", logFilePath)
}
