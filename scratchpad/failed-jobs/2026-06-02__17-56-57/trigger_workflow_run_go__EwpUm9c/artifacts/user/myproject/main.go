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
	runID := strings.TrimSpace(os.Getenv("ZEALT_RUN_ID"))
	email := strings.TrimSpace(os.Getenv("MAGICBELL_EMAIL"))
	token := strings.TrimSpace(os.Getenv("MAGICBELL_PROJECT_TOKEN"))

	if runID == "" || email == "" || token == "" {
		log.Fatal("Missing required environment variables: ZEALT_RUN_ID, MAGICBELL_EMAIL, MAGICBELL_PROJECT_TOKEN")
	}

	parts := strings.SplitN(email, "@", 2)
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		log.Fatalf("Invalid MAGICBELL_EMAIL value: %s", email)
	}

	recipientEmail := fmt.Sprintf("%s+trigger-go-%s@%s", parts[0], runID, parts[1])
	workflowKey := fmt.Sprintf("wf-trigger-go-%s", runID)
	marker := fmt.Sprintf("trigger-go-%s", runID)

	config := clientconfig.NewConfig()
	config.SetAccessToken(token)
	mbClient := client.NewClient(config)

	stepInput := map[string]any{
		"title":      "Trigger Go Run {{ marker }}",
		"content":    "Triggered from Go SDK",
		"recipients": []map[string]string{{"email": recipientEmail}},
	}
	stepInputBytes, err := json.Marshal(stepInput)
	if err != nil {
		log.Fatalf("Failed to marshal step input: %v", err)
	}

	workflow := workflows.WorkflowDefinition{
		Key: util.ToPointer(workflowKey),
		Steps: []workflows.WorkflowDefinitionSteps{
			{
				Command: util.ToPointer("broadcast"),
				Input: util.ToPointer(util.Nullable[any]{
					Value: json.RawMessage(stepInputBytes),
				}),
			},
		},
	}

	_, saveErr := mbClient.Workflows.SaveWorkflow(context.Background(), workflow)
	if saveErr != nil {
		log.Fatalf("Failed to save workflow: %v", saveErr)
	}

	runInput := map[string]string{
		"marker": marker,
	}
	runInputBytes, err := json.Marshal(runInput)
	if err != nil {
		log.Fatalf("Failed to marshal run input: %v", err)
	}

	executeRequest := workflows.ExecuteWorkflowRequest{
		Key: util.ToPointer(workflowKey),
		Input: util.ToPointer(util.Nullable[any]{
			Value: json.RawMessage(runInputBytes),
		}),
	}

	runResponse, runErr := mbClient.Workflows.CreateWorkflowRun(context.Background(), executeRequest)
	if runErr != nil {
		log.Fatalf("Failed to create workflow run: %v", runErr)
	}

	runIDValue := ""
	if runResponse != nil && runResponse.Data.Id != nil {
		runIDValue = *runResponse.Data.Id
	}
	if runIDValue == "" {
		log.Fatal("Workflow run ID missing in response")
	}

	output := fmt.Sprintf("Workflow Run ID: %s\n", runIDValue)
	if err := os.WriteFile("/home/user/myproject/output.log", []byte(output), 0644); err != nil {
		log.Fatalf("Failed to write output log: %v", err)
	}
}
