package main

import (
	"bytes"
	"context"
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
		fmt.Fprintf(os.Stderr, "Usage: go run main.go <action>\nActions: create, fetch, delete\n")
		os.Exit(1)
	}

	action := os.Args[1]

	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		fmt.Fprintf(os.Stderr, "MAGICBELL_PROJECT_TOKEN environment variable is required\n")
		os.Exit(1)
	}

	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		fmt.Fprintf(os.Stderr, "ZEALT_RUN_ID environment variable is required\n")
		os.Exit(1)
	}

	email := os.Getenv("MAGICBELL_EMAIL")
	if email == "" {
		fmt.Fprintf(os.Stderr, "MAGICBELL_EMAIL environment variable is required\n")
		os.Exit(1)
	}

	workflowKey := fmt.Sprintf("test-workflow-%s", runID)

	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	sdkClient := client.NewClient(config)

	ctx := context.Background()

	switch action {
	case "create":
		recipientEmail := fmt.Sprintf("%s+test@gmail.com", strings.Split(email, "@")[0])
		err := createWorkflow(ctx, sdkClient, workflowKey, recipientEmail)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error creating workflow: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Created workflow: %s\n", workflowKey)

	case "fetch":
		err := fetchWorkflow(projectToken, workflowKey)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error fetching workflow: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Fetched workflow: %s\n", workflowKey)

	case "delete":
		err := deleteWorkflow(projectToken, workflowKey)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error deleting workflow: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Deleted workflow: %s\n", workflowKey)

	default:
		fmt.Fprintf(os.Stderr, "Unknown action: %s. Use create, fetch, or delete.\n", action)
		os.Exit(1)
	}
}

func createWorkflow(ctx context.Context, sdkClient *client.Client, workflowKey string, recipientEmail string) error {
	inputData := map[string]interface{}{
		"recipients": []map[string]interface{}{
			{
				"email": recipientEmail,
			},
		},
		"title":   "Test Notification",
		"content": "This is a test notification from the workflow.",
	}

	broadcastStep := workflows.WorkflowDefinitionSteps{
		Command: util.ToPointer("broadcast"),
		Input:   &util.Nullable[any]{Value: inputData},
	}

	workflowDef := workflows.WorkflowDefinition{
		Key:   util.ToPointer(workflowKey),
		Steps: []workflows.WorkflowDefinitionSteps{broadcastStep},
	}

	_, err := sdkClient.Workflows.SaveWorkflow(ctx, workflowDef)
	return err
}

func fetchWorkflow(projectToken string, workflowKey string) error {
	url := fmt.Sprintf("%s/workflows/%s", baseURL, workflowKey)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return fmt.Errorf("creating request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", projectToken))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("making request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("unexpected status code %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

func deleteWorkflow(projectToken string, workflowKey string) error {
	url := fmt.Sprintf("%s/workflows/%s", baseURL, workflowKey)

	req, err := http.NewRequest("DELETE", url, bytes.NewReader(nil))
	if err != nil {
		return fmt.Errorf("creating request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", projectToken))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("making request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("unexpected status code %d: %s", resp.StatusCode, string(body))
	}

	return nil
}