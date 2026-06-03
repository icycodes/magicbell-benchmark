package main

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
	"github.com/magicbell/magicbell-go/pkg/project-client/workflows"
)

func getPlusEmail(email, receiverID string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return email + "+" + receiverID + "@gmail.com"
	}
	return parts[0] + "+" + receiverID + "@" + parts[1]
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run main.go <action>")
		os.Exit(1)
	}
	action := os.Args[1]

	token := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	runID := os.Getenv("ZEALT_RUN_ID")
	email := os.Getenv("MAGICBELL_EMAIL")

	workflowKey := fmt.Sprintf("test-workflow-%s", runID)

	switch action {
	case "create":
		config := clientconfig.NewConfig()
		config.SetAccessToken(token)
		sdk := client.NewClient(config)

		command := "broadcast"
		input := map[string]interface{}{
			"recipients": []map[string]interface{}{
				{
					"email": getPlusEmail(email, "test"),
				},
			},
		}

		def := workflows.WorkflowDefinition{
			Key: &workflowKey,
			Steps: []workflows.WorkflowDefinitionSteps{
				{
					Command: &command,
					Input:   &util.Nullable[any]{Value: input},
				},
			},
		}

		_, err := sdk.Workflows.SaveWorkflow(context.Background(), def)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Created workflow: %s\n", workflowKey)

	case "fetch":
		req, err := http.NewRequest("GET", fmt.Sprintf("https://api.magicbell.com/v2/workflows/%s", workflowKey), nil)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			os.Exit(1)
		}
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Accept", "application/json")

		httpClient := &http.Client{Timeout: 10 * time.Second}
		resp, err := httpClient.Do(req)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			os.Exit(1)
		}
		defer resp.Body.Close()

		if resp.StatusCode >= 400 {
			fmt.Printf("Error: HTTP request failed with status code %d\n", resp.StatusCode)
			os.Exit(1)
		}

		fmt.Printf("Fetched workflow: %s\n", workflowKey)

	case "delete":
		req, err := http.NewRequest("DELETE", fmt.Sprintf("https://api.magicbell.com/v2/workflows/%s", workflowKey), nil)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			os.Exit(1)
		}
		req.Header.Set("Authorization", "Bearer "+token)

		httpClient := &http.Client{Timeout: 10 * time.Second}
		resp, err := httpClient.Do(req)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			os.Exit(1)
		}
		resp.Body.Close()

		if resp.StatusCode == 405 {
			// Fallback to disabling
			payload := []byte(fmt.Sprintf(`{"key": "%s", "steps": [], "disabled": true}`, workflowKey))
			req, err := http.NewRequest("PUT", "https://api.magicbell.com/v2/workflows", bytes.NewBuffer(payload))
			if err != nil {
				fmt.Printf("Error: %v\n", err)
				os.Exit(1)
			}
			req.Header.Set("Authorization", "Bearer "+token)
			req.Header.Set("Content-Type", "application/json")

			resp2, err := httpClient.Do(req)
			if err != nil {
				fmt.Printf("Error: %v\n", err)
				os.Exit(1)
			}
			defer resp2.Body.Close()

			if resp2.StatusCode >= 400 {
				fmt.Printf("Error: HTTP request failed with status code %d\n", resp2.StatusCode)
				os.Exit(1)
			}
		} else if resp.StatusCode >= 400 {
			fmt.Printf("Error: HTTP request failed with status code %d\n", resp.StatusCode)
			os.Exit(1)
		}

		fmt.Printf("Deleted workflow: %s\n", workflowKey)

	default:
		fmt.Printf("Unknown action: %s\n", action)
		os.Exit(1)
	}
}
