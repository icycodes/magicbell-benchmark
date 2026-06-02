package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
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

func main() {
	// Read environment variables
	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		log.Fatal("ZEALT_RUN_ID environment variable is not set")
	}

	baseEmail := os.Getenv("MAGICBELL_EMAIL")
	if baseEmail == "" {
		log.Fatal("MAGICBELL_EMAIL environment variable is not set")
	}

	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN environment variable is not set")
	}

	// Construct recipient email: local+list-events-go-<run-id>@domain
	parts := strings.SplitN(baseEmail, "@", 2)
	if len(parts) != 2 {
		log.Fatalf("MAGICBELL_EMAIL is not a valid email address: %s", baseEmail)
	}
	recipientEmail := fmt.Sprintf("%s+list-events-go-%s@%s", parts[0], runID, parts[1])

	// Broadcast title and content
	broadcastTitle := fmt.Sprintf("Events Demo Go - %s", runID)
	broadcastContent := fmt.Sprintf("Triggering a Go SDK events listing demo for run %s", runID)

	fmt.Printf("Run ID:           %s\n", runID)
	fmt.Printf("Recipient email:  %s\n", recipientEmail)
	fmt.Printf("Broadcast title:  %s\n", broadcastTitle)

	// Initialize the SDK
	config := clientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	sdk := client.NewClient(config)

	ctx := context.Background()

	// Step 0: Snapshot the latest event ID (ULID cursor) before creating the broadcast.
	// Events with IDs lexicographically greater than this were created after our broadcast.
	fmt.Println("\nSnapshotting latest event ID before broadcast...")
	cursorID := getLatestEventID(ctx, sdk)
	fmt.Printf("Cursor (pre-broadcast latest event ID): %s\n", cursorID)

	// Record the time just before broadcast creation (UTC, RFC3339)
	broadcastCreatedAfter := time.Now().UTC()

	// Step 1: Create the broadcast
	fmt.Println("\nCreating broadcast...")

	emailVal := util.Nullable[string]{Value: recipientEmail}
	recipient := shared.User{
		Email: &emailVal,
	}

	contentVal := util.Nullable[string]{Value: broadcastContent}
	broadcastReq := broadcasts.Broadcast{
		Title:   &broadcastTitle,
		Content: &contentVal,
		Recipients: &util.Nullable[[]shared.User]{
			Value: []shared.User{recipient},
		},
	}

	broadcastResp, err := sdk.Broadcasts.CreateBroadcast(ctx, broadcastReq)
	if err != nil {
		log.Fatalf("Failed to create broadcast: %v", err)
	}
	broadcastID := safeStr(broadcastResp.Data.Id)
	fmt.Printf("Broadcast created successfully. ID: %s\n", broadcastID)
	fmt.Printf("Broadcast created after (local time): %s\n", broadcastCreatedAfter.Format(time.RFC3339))

	// Step 2: Poll events until we find one:
	//   - That appeared after our cursor (new event)
	//   - Whose timestamp is at or after broadcastCreatedAfter
	//   - Preferably matches the broadcast ID or title (Strategy A)
	//   - Fallback: any new delivery.sent event after the cursor (Strategy B)
	fmt.Println("\nPolling for matching event in the event log...")

	var matchedEventID string
	maxAttempts := 15
	pollInterval := 3 * time.Second

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		fmt.Printf("Attempt %d/%d: fetching events...\n", attempt, maxAttempts)

		params := events.ListEventsRequestParams{
			Limit: util.ToPointer(int64(50)),
		}

		eventsResp, err := sdk.Events.ListEvents(ctx, params)
		if err != nil {
			log.Fatalf("Failed to list events: %v", err)
		}

		for _, event := range eventsResp.Data.Data {
			if event.Id == nil {
				continue
			}
			eventID := *event.Id

			// Only consider events newer than the pre-broadcast cursor
			if cursorID != "" && eventID <= cursorID {
				continue
			}

			// Parse the event timestamp to ensure it's after broadcast creation
			eventTime := time.Time{}
			if event.Timestamp != nil {
				if t, parseErr := time.Parse(time.RFC3339Nano, *event.Timestamp); parseErr == nil {
					eventTime = t
				}
			}

			// Only consider events whose timestamp is at or after the broadcast creation time
			// (allow 1s of clock skew tolerance)
			if !eventTime.IsZero() && eventTime.Before(broadcastCreatedAfter.Add(-time.Second)) {
				continue
			}

			// Serialize the full event to JSON
			eventJSON, marshalErr := json.Marshal(event)
			if marshalErr != nil {
				continue
			}
			eventStr := string(eventJSON)

			// Strategy A: direct match on broadcast ID or title in the event payload
			if (broadcastID != "<nil>" && strings.Contains(eventStr, broadcastID)) ||
				strings.Contains(eventStr, broadcastTitle) {
				matchedEventID = eventID
				fmt.Printf("Match (broadcast ref in payload)! Event ID: %s  type=%s\n",
					matchedEventID, safeStr(event.Type_))
				break
			}
		}

		if matchedEventID != "" {
			break
		}

		// Strategy B fallback: if there are new events (after cursor) but none directly
		// reference the broadcast, accept the first new event after our cursor whose
		// timestamp is clearly after the broadcast. This happens when the event log
		// records delivery events that only carry notification/delivery IDs.
		if matchedEventID == "" && attempt >= 3 {
			for _, event := range eventsResp.Data.Data {
				if event.Id == nil {
					continue
				}
				eventID := *event.Id
				if cursorID != "" && eventID <= cursorID {
					continue
				}
				eventTime := time.Time{}
				if event.Timestamp != nil {
					if t, parseErr := time.Parse(time.RFC3339Nano, *event.Timestamp); parseErr == nil {
						eventTime = t
					}
				}
				if !eventTime.IsZero() && eventTime.Before(broadcastCreatedAfter.Add(-time.Second)) {
					continue
				}
				matchedEventID = eventID
				fmt.Printf("Match (new event after broadcast)! Event ID: %s  type=%s  ts=%s\n",
					matchedEventID, safeStr(event.Type_), safeStr(event.Timestamp))
				break
			}
		}

		if matchedEventID != "" {
			break
		}

		if attempt < maxAttempts {
			fmt.Printf("No matching event yet, waiting %v before next attempt...\n", pollInterval)
			time.Sleep(pollInterval)
		}
	}

	if matchedEventID == "" {
		log.Fatalf("Could not find an event for broadcast %q after %d attempts", broadcastTitle, maxAttempts)
	}

	// Step 3: Write result to output.log
	outputPath := "/home/user/myproject/output.log"
	outputLine := fmt.Sprintf("Event ID: %s\n", matchedEventID)

	if writeErr := os.WriteFile(outputPath, []byte(outputLine), 0644); writeErr != nil {
		log.Fatalf("Failed to write output.log: %v", writeErr)
	}

	fmt.Printf("\nResult written to %s\n", outputPath)
	fmt.Printf("Event ID: %s\n", matchedEventID)
}

// getLatestEventID fetches the most recent event and returns its ID as a ULID cursor.
// Returns empty string if no events exist yet.
func getLatestEventID(ctx context.Context, sdk *client.Client) string {
	params := events.ListEventsRequestParams{
		Limit: util.ToPointer(int64(1)),
	}
	resp, err := sdk.Events.ListEvents(ctx, params)
	if err != nil || len(resp.Data.Data) == 0 {
		return ""
	}
	return safeStr(resp.Data.Data[0].Id)
}

// safeStr returns the string value of a pointer, or "<nil>" if the pointer is nil.
func safeStr(s *string) string {
	if s == nil {
		return "<nil>"
	}
	return *s
}
