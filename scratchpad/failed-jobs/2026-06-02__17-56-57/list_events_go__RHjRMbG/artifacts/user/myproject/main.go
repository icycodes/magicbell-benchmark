package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/magicbell/magicbell-go/pkg/project-client/broadcasts"
	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/events"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	"github.com/magicbell/magicbell-go/pkg/project-client/util"
)

const (
	outputPath = "/home/user/myproject/output.log"
)

func main() {
	runID := requireEnv("ZEALT_RUN_ID")
	baseEmail := requireEnv("MAGICBELL_EMAIL")
	projectToken := requireEnv("MAGICBELL_PROJECT_TOKEN")

	recipientEmail, err := buildRecipientEmail(baseEmail, runID)
	if err != nil {
		fail("recipient email", err)
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)

	sdk := client.NewClient(config)
	ctx := context.Background()

	title := fmt.Sprintf("Events Demo Go - %s", runID)
	content := fmt.Sprintf("Triggering a Go SDK events listing demo for run %s", runID)

	broadcast := broadcasts.Broadcast{
		Title: util.ToPointer(title),
		Content: &util.Nullable[string]{
			Value: content,
		},
		Recipients: &util.Nullable[[]shared.User]{
			Value: []shared.User{
				{
					Email: &util.Nullable[string]{
						Value: recipientEmail,
					},
				},
			},
		},
	}

	_, createErr := sdk.Broadcasts.CreateBroadcast(ctx, broadcast)
	if createErr != nil {
		fail("create broadcast", createErr)
	}

	eventID, err := findBroadcastEventID(ctx, sdk, title)
	if err != nil {
		fail("find broadcast event", err)
	}

	if err := os.WriteFile(outputPath, []byte(fmt.Sprintf("Event ID: %s\n", eventID)), 0644); err != nil {
		fail("write output", err)
	}
}

func requireEnv(name string) string {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		fail(name, fmt.Errorf("environment variable not set"))
	}
	return value
}

func buildRecipientEmail(baseEmail, runID string) (string, error) {
	parts := strings.SplitN(baseEmail, "@", 2)
	if len(parts) != 2 {
		return "", fmt.Errorf("invalid email: %s", baseEmail)
	}

	return fmt.Sprintf("%s+list-events-go-%s@%s", parts[0], runID, parts[1]), nil
}

func findBroadcastEventID(ctx context.Context, sdk *client.Client, title string) (string, error) {
	params := events.ListEventsRequestParams{
		Limit: util.ToPointer(int64(200)),
	}

	for attempt := 0; attempt < 30; attempt++ {
		response, err := sdk.Events.ListEvents(ctx, params)
		if err != nil {
			return "", err
		}

		for _, event := range response.Data.Data {
			if eventContainsTitle(event, title) {
				if event.Id != nil {
					return *event.Id, nil
				}
			}
		}

		time.Sleep(4 * time.Second)
	}

	return "", fmt.Errorf("no event found with title %q", title)
}

func eventContainsTitle(event events.Event, title string) bool {
	if containsInNullableAny(event.Payload, title) {
		return true
	}

	if containsInNullableAny(event.Context, title) {
		return true
	}

	if containsInNullableString(event.Log, title) {
		return true
	}

	eventBytes, err := json.Marshal(event)
	if err != nil {
		return false
	}

	return strings.Contains(string(eventBytes), title)
}

func containsInNullableAny(value *util.Nullable[any], title string) bool {
	if value == nil || value.IsNull {
		return false
	}

	payloadBytes, err := json.Marshal(value.Value)
	if err != nil {
		return false
	}

	return strings.Contains(string(payloadBytes), title)
}

func containsInNullableString(value *util.Nullable[string], title string) bool {
	if value == nil || value.IsNull {
		return false
	}

	return strings.Contains(value.Value, title)
}

func fail(step string, err error) {
	_, _ = fmt.Fprintf(os.Stderr, "failed to %s: %v\n", step, err)
	os.Exit(1)
}
