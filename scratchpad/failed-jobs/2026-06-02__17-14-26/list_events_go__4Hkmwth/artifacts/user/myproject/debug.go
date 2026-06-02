package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"
	"strings"

	"github.com/magicbell/magicbell-go/pkg/project-client/broadcasts"
	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/events"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
)

func main() {
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	sdk := client.NewClient(config)

	title := "Events Demo Go - test-run-1234"
	content := "Triggering a Go SDK events listing demo for run test-run-1234"

	userEmailNullable := util.Nullable[string]{Value: "test+test-run-1234@example.com", IsNull: false}
	recipient := shared.User{Email: &userEmailNullable}
	recipientsNullable := util.Nullable[[]shared.User]{Value: []shared.User{recipient}, IsNull: false}

	titlePtr := title
	contentNullable := util.Nullable[string]{Value: content, IsNull: false}

	broadcast := broadcasts.Broadcast{
		Title:      &titlePtr,
		Content:    &contentNullable,
		Recipients: &recipientsNullable,
	}

	_, err := sdk.Broadcasts.CreateBroadcast(context.Background(), broadcast)
	if err != nil {
		log.Fatalf("Failed to create broadcast: %v", err)
	}

	limit := int64(100)
	params := events.ListEventsRequestParams{Limit: &limit}

	for i := 0; i < 20; i++ {
		time.Sleep(3 * time.Second)
		resp, _ := sdk.Events.ListEvents(context.Background(), params)
		if resp == nil { continue }
		
		for _, event := range resp.Data.Data {
			eventBytes, _ := json.Marshal(event)
			if strings.Contains(string(eventBytes), "test-run-1234") {
				fmt.Printf("Found Event: %s, Type: %s, Full JSON: %s\n", *event.Id, *event.Type_, string(eventBytes))
				return
			}
		}
	}
	fmt.Println("Not found")
}
