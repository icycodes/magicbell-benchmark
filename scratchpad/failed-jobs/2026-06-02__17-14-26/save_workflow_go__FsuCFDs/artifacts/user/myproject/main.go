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
	token := os.Getenv("MAGICBELL_PROJECT_TOKEN")

	if runID == "" {
		runID = "default-run-id"
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(token)
	projectClient := client.NewClient(config)

	wfDef := workflows.WorkflowDefinition{
		Key: util.ToPointer(fmt.Sprintf("wf-save-go-%s", runID)),
		Steps: []workflows.WorkflowDefinitionSteps{
			{
				Command: util.ToPointer("broadcast"),
				Input: util.ToPointer(util.Nullable[any]{
					Value: map[string]interface{}{
						"title":   fmt.Sprintf("Workflow Save Go - %s", runID),
						"content": "Hello from Go saved workflow",
					},
				}),
			},
		},
	}

	resp, err := projectClient.Workflows.SaveWorkflow(context.Background(), wfDef)
	if err != nil {
		log.Fatalf("Failed to save workflow: %v", err)
	}

	key := *resp.Data.Key
	out := fmt.Sprintf("Workflow Key: %s\n", key)
	if err := os.WriteFile("/home/user/myproject/output.log", []byte(out), 0644); err != nil {
		log.Fatalf("Failed to write output.log: %v", err)
	}
	
	fmt.Println("Workflow saved successfully:", key)
}
