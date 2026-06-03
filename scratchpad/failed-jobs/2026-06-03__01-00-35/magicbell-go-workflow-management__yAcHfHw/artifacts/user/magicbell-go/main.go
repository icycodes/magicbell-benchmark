package main

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
	"github.com/magicbell/magicbell-go/pkg/project-client/workflows"
)

type customTransport struct {
	underlying  http.RoundTripper
	workflowKey string
	action      string
}

func (t *customTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	urlStr := req.URL.String()
	if strings.Contains(urlStr, "/workflows/*") {
		newURL := strings.Replace(urlStr, "/workflows/*", "/workflows/"+t.workflowKey, 1)
		u, err := url.Parse(newURL)
		if err != nil {
			return nil, err
		}
		req.URL = u
		if t.action == "delete" {
			req.Method = "DELETE"
		}
	}
	fmt.Printf("DEBUG: Requesting %s %s\n", req.Method, req.URL.String())
	underlying := t.underlying
	if underlying == nil {
		underlying = http.DefaultTransport
	}
	return underlying.RoundTrip(req)
}

func getRecipientEmail() string {
	emailVar := os.Getenv("MAGICBELL_EMAIL")
	if emailVar == "" {
		emailVar = "test"
	}
	if strings.Contains(emailVar, "@") {
		parts := strings.Split(emailVar, "@")
		return fmt.Sprintf("%s+%s@gmail.com", parts[0], "test")
	}
	return fmt.Sprintf("%s+%s@gmail.com", emailVar, "test")
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run main.go <action>")
		os.Exit(1)
	}

	action := os.Args[1]
	if action != "create" && action != "fetch" && action != "delete" {
		fmt.Printf("Invalid action: %s. Must be create, fetch, or delete.\n", action)
		os.Exit(1)
	}

	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		fmt.Println("Error: ZEALT_RUN_ID environment variable is required")
		os.Exit(1)
	}

	workflowKey := fmt.Sprintf("test-workflow-%s", runID)

	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		fmt.Println("Error: MAGICBELL_PROJECT_TOKEN environment variable is required")
		os.Exit(1)
	}

	// Install custom transport to intercept/modify requests
	originalTransport := http.DefaultTransport
	http.DefaultTransport = &customTransport{
		underlying:  originalTransport,
		workflowKey: workflowKey,
		action:      action,
	}
	defer func() {
		http.DefaultTransport = originalTransport
	}()

	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	c := client.NewClient(config)

	ctx := context.Background()

	switch action {
	case "create":
		recipientEmail := getRecipientEmail()
		wf := workflows.WorkflowDefinition{
			Key: util.ToPointer(workflowKey),
			Steps: []workflows.WorkflowDefinitionSteps{
				{
					Command: util.ToPointer("broadcast"),
					Input: &util.Nullable[any]{
						Value: map[string]any{
							"title":   "Test Broadcast",
							"content": "This is a test notification from workflow.",
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

		_, err := c.Workflows.SaveWorkflow(ctx, wf)
		if err != nil {
			fmt.Printf("Error saving workflow: %v\n", err)
			os.Exit(1)
		}

		fmt.Printf("Created workflow: %s\n", workflowKey)

	case "fetch":
		_, err := c.Workflows.FetchWorkflow(ctx)
		if err != nil {
			fmt.Printf("Error fetching workflow: %v\n", err)
			os.Exit(1)
		}

		fmt.Printf("Fetched workflow: %s\n", workflowKey)

	case "delete":
		_, err := c.Workflows.FetchWorkflow(ctx)
		if err != nil {
			fmt.Printf("Error deleting workflow: %v\n", err)
			os.Exit(1)
		}

		fmt.Printf("Deleted workflow: %s\n", workflowKey)
	}
}
