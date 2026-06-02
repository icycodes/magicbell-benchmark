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
	runID := os.Getenv("ZEALT_RUN_ID")
	email := os.Getenv("MAGICBELL_EMAIL")
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")

	if runID == "" || email == "" || projectToken == "" {
		log.Fatal("Missing required environment variables")
	}

	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		log.Fatalf("Invalid email format: %s", email)
	}
	computedEmail := fmt.Sprintf("%s+trigger-go-%s@%s", parts[0], runID, parts[1])

	cfg := clientconfig.NewConfig()
	cfg.SetAccessToken(projectToken)
	c := client.NewClient(cfg)

	wfKey := fmt.Sprintf("wf-trigger-go-%s", runID)

	stepInputObj := map[string]interface{}{
		"title":   "Trigger Go Run {{ marker }}",
		"content": "This is a test broadcast from Go SDK",
		"recipients": []map[string]interface{}{
			{
				"email": computedEmail,
			},
		},
	}

	wfDef := workflows.WorkflowDefinition{
		Key: util.ToPointer(wfKey),
		Steps: []workflows.WorkflowDefinitionSteps{
			{
				Command: util.ToPointer("broadcast"),
				Input:   &util.Nullable[any]{Value: stepInputObj},
			},
		},
	}

	ctx := context.Background()
	_, err := c.Workflows.SaveWorkflow(ctx, wfDef)
	if err != nil {
		log.Fatalf("Failed to save workflow: %v", err)
	}

	runInputObj := map[string]interface{}{
		"marker": fmt.Sprintf("trigger-go-%s", runID),
	}

	execReq := workflows.ExecuteWorkflowRequest{
		Key:   util.ToPointer(wfKey),
		Input: &util.Nullable[any]{Value: runInputObj},
	}

	runRes, err2 := c.Workflows.CreateWorkflowRun(ctx, execReq)
	if err2 != nil {
		log.Fatalf("Failed to create workflow run: %v", err2)
	}

	runIDStr := *runRes.Data.Id
	
	outputStr := fmt.Sprintf("Workflow Run ID: %s\n", runIDStr)
	errWrite := os.WriteFile("/home/user/myproject/output.log", []byte(outputStr), 0644)
	if errWrite != nil {
		log.Fatalf("Failed to write output log: %v", errWrite)
	}
	fmt.Printf("Success: %s", outputStr)
}
