package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
	"github.com/magicbell/magicbell-go/pkg/project-client/workflows"
)

const baseURL = "https://api.magicbell.com/v2"

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "Usage: go run main.go <create|fetch|delete>")
		os.Exit(1)
	}

	action := os.Args[1]

	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		fmt.Fprintln(os.Stderr, "MAGICBELL_PROJECT_TOKEN environment variable is not set")
		os.Exit(1)
	}

	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		fmt.Fprintln(os.Stderr, "ZEALT_RUN_ID environment variable is not set")
		os.Exit(1)
	}

	workflowKey := fmt.Sprintf("test-workflow-%s", runID)

	switch action {
	case "create":
		createWorkflow(projectToken, workflowKey)
	case "fetch":
		fetchWorkflow(projectToken, workflowKey)
	case "delete":
		deleteWorkflow(projectToken, workflowKey)
	default:
		fmt.Fprintf(os.Stderr, "Unknown action: %s. Must be one of: create, fetch, delete\n", action)
		os.Exit(1)
	}
}

func createWorkflow(projectToken, workflowKey string) {
	email := os.Getenv("MAGICBELL_EMAIL")
	if email == "" {
		fmt.Fprintln(os.Stderr, "MAGICBELL_EMAIL environment variable is not set")
		os.Exit(1)
	}

	// Build plus-format recipient email: {local}+test@{domain}
	recipientEmail := buildPlusEmail(email, "test")

	// Build the broadcast step input as a JSON-serializable map
	broadcastInput := map[string]interface{}{
		"notification": map[string]interface{}{
			"title": "Test Notification",
		},
		"recipients": []map[string]interface{}{
			{"email": recipientEmail},
		},
	}

	inputBytes, err := json.Marshal(broadcastInput)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to marshal broadcast input: %v\n", err)
		os.Exit(1)
	}

	var inputAny interface{}
	if err := json.Unmarshal(inputBytes, &inputAny); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to unmarshal broadcast input: %v\n", err)
		os.Exit(1)
	}

	command := "broadcast"
	step := workflows.WorkflowDefinitionSteps{
		Command: util.ToPointer(command),
		Input:   &util.Nullable[any]{Value: inputAny},
	}

	disabled := false
	workflowDef := workflows.WorkflowDefinition{
		Key:      util.ToPointer(workflowKey),
		Disabled: &disabled,
		Steps:    []workflows.WorkflowDefinitionSteps{step},
	}

	cfg := clientconfig.NewConfig()
	cfg.SetAccessToken(projectToken)
	sdkClient := client.NewClient(cfg)

	resp, clientErr := sdkClient.Workflows.SaveWorkflow(context.Background(), workflowDef)
	if clientErr != nil {
		fmt.Fprintf(os.Stderr, "Failed to create workflow: %v\n", clientErr.Err)
		os.Exit(1)
	}

	if resp == nil {
		fmt.Fprintln(os.Stderr, "Failed to create workflow: empty response")
		os.Exit(1)
	}

	fmt.Printf("Created workflow: %s\n", workflowKey)
}

func fetchWorkflow(projectToken, workflowKey string) {
	url := fmt.Sprintf("%s/workflows/%s", baseURL, workflowKey)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to create HTTP request: %v\n", err)
		os.Exit(1)
	}

	req.Header.Set("Authorization", "Bearer "+projectToken)
	req.Header.Set("Accept", "application/json")

	httpClient := &http.Client{}
	resp, err := httpClient.Do(req)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to fetch workflow: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		fmt.Fprintf(os.Stderr, "Failed to fetch workflow (status %d): %s\n", resp.StatusCode, string(body))
		os.Exit(1)
	}

	fmt.Printf("Fetched workflow: %s\n", workflowKey)
}

func deleteWorkflow(projectToken, workflowKey string) {
	url := fmt.Sprintf("%s/workflows/%s", baseURL, workflowKey)

	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to create HTTP request: %v\n", err)
		os.Exit(1)
	}

	req.Header.Set("Authorization", "Bearer "+projectToken)
	req.Header.Set("Accept", "application/json")

	httpClient := &http.Client{}
	resp, err := httpClient.Do(req)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to delete workflow: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		fmt.Fprintf(os.Stderr, "Failed to delete workflow (status %d): %s\n", resp.StatusCode, string(body))
		os.Exit(1)
	}

	fmt.Printf("Deleted workflow: %s\n", workflowKey)
}

// buildPlusEmail converts "user@gmail.com" to "user+<receiverID>@gmail.com"
func buildPlusEmail(email, receiverID string) string {
	atIdx := strings.LastIndex(email, "@")
	if atIdx < 0 {
		// fallback: just append
		return email + "+" + receiverID
	}
	local := email[:atIdx]
	domain := email[atIdx:] // includes "@"
	return fmt.Sprintf("%s+%s%s", local, receiverID, domain)
}
