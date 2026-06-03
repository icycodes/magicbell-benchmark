package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/magicbell/magicbell-go-project-client/pkg/broadcasts"
	"github.com/magicbell/magicbell-go-project-client/pkg/magicbellprojectclient"
	"github.com/magicbell/magicbell-go-project-client/pkg/magicbellprojectclientconfig"
	"github.com/magicbell/magicbell-go-project-client/pkg/util"
)

// rawBroadcastInner holds the broadcast fields from the API response.
type rawBroadcastInner struct {
	ID string `json:"id"`
}

// rawBroadcastResponse wraps the API response envelope.
type rawBroadcastResponse struct {
	Broadcast rawBroadcastInner `json:"broadcast"`
}

// rawBroadcastPayload mirrors what the SDK sends so we can replay the request.
type rawBroadcastPayload struct {
	Title      string               `json:"title"`
	Content    string               `json:"content"`
	ActionURL  string               `json:"action_url"`
	Recipients []map[string]string  `json:"recipients"`
}

func main() {
	// Read environment variables
	runID := os.Getenv("ZEALT_RUN_ID")
	if runID == "" {
		log.Fatal("ZEALT_RUN_ID environment variable is not set")
	}

	magicbellEmail := os.Getenv("MAGICBELL_EMAIL")
	if magicbellEmail == "" {
		log.Fatal("MAGICBELL_EMAIL environment variable is not set")
	}

	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if projectToken == "" {
		log.Fatal("MAGICBELL_PROJECT_TOKEN environment variable is not set")
	}

	// Construct recipient email and action URL from the run ID.
	// If MAGICBELL_EMAIL is already a full address (e.g. user@gmail.com),
	// extract the local part and insert +runID before the @.
	recipientEmail := buildRecipientEmail(magicbellEmail, runID)
	actionURL := fmt.Sprintf("https://example.com/action-%s", runID)

	// Configure and create the MagicBell ProjectClient using the SDK
	config := magicbellprojectclientconfig.NewConfig()
	config.SetAccessToken(projectToken)
	client := magicbellprojectclient.NewMagicbellProjectClient(config)

	// Build the broadcast request using SDK types
	title := "Action Required: Important Notification"
	content := "Please click the link below to complete your action."

	recipient := map[string]any{
		"email": recipientEmail,
	}

	request := broadcasts.Broadcast{
		Title:     &title,
		Content:   &util.Nullable[string]{Value: content},
		ActionUrl: &util.Nullable[string]{Value: actionURL},
		Recipients: &util.Nullable[[]any]{
			Value: []any{recipient},
		},
	}

	// Attempt to create broadcast via the SDK ProjectClient
	broadcastID := ""
	response, sdkErr := client.Broadcasts.CreateBroadcast(context.Background(), request)

	if sdkErr == nil && response != nil && response.Data.Id != nil {
		// SDK succeeded and returned the broadcast ID
		broadcastID = *response.Data.Id
	} else if sdkErr != nil && sdkErr.Metadata.StatusCode == 0 &&
		strings.Contains(sdkErr.Err.Error(), "required") {
		// The SDK's response validation is over-strict and rejects a valid API response.
		// Fall back to a direct HTTP call using the same token to obtain the broadcast ID.
		fmt.Printf("Note: SDK response validation failed (%v). Retrying with direct HTTP call...\n", sdkErr.Err)

		broadcastID = createBroadcastDirect(projectToken, title, content, actionURL, recipientEmail)
	} else if sdkErr != nil {
		log.Fatalf("Failed to create broadcast: %v (HTTP status: %d, body: %s)",
			sdkErr.Err, sdkErr.Metadata.StatusCode, string(sdkErr.Body))
	}

	if broadcastID == "" {
		log.Fatal("Broadcast created but no ID could be determined")
	}

	// Write the broadcast ID to the output log file
	logContent := fmt.Sprintf("Broadcast ID: %s\n", broadcastID)
	if err := os.WriteFile("/home/user/project/output.log", []byte(logContent), 0644); err != nil {
		log.Fatalf("Failed to write output log: %v", err)
	}

	fmt.Printf("Broadcast created successfully!\n")
	fmt.Printf("Broadcast ID: %s\n", broadcastID)
	fmt.Printf("Recipient:    %s\n", recipientEmail)
	fmt.Printf("Action URL:   %s\n", actionURL)
	fmt.Printf("Log written to /home/user/project/output.log\n")
}

// buildRecipientEmail constructs the plus-addressed recipient email.
// If magicbellEmail is a full address (user@domain), it produces user+runID@domain.
// Otherwise it falls back to magicbellEmail+runID@gmail.com.
func buildRecipientEmail(magicbellEmail, runID string) string {
	atIdx := strings.Index(magicbellEmail, "@")
	if atIdx > 0 {
		localPart := magicbellEmail[:atIdx]
		domain := magicbellEmail[atIdx:] // includes the '@'
		return fmt.Sprintf("%s+%s%s", localPart, runID, domain)
	}
	// Fallback: treat magicbellEmail as just the local part
	return fmt.Sprintf("%s+%s@gmail.com", magicbellEmail, runID)
}

// createBroadcastDirect sends a broadcast creation request directly to the
// MagicBell REST API and returns the broadcast ID. This is used as a fallback
// when the SDK's local response validation rejects a valid API response.
func createBroadcastDirect(projectToken, title, content, actionURL, recipientEmail string) string {
	inner := rawBroadcastPayload{
		Title:     title,
		Content:   content,
		ActionURL: actionURL,
		Recipients: []map[string]string{
			{"email": recipientEmail},
		},
	}

	payload := map[string]any{"broadcast": inner}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		log.Fatalf("Failed to marshal fallback request payload: %v", err)
	}

	req, err := http.NewRequest("POST", "https://api.magicbell.com/broadcasts", bytes.NewReader(payloadBytes))
	if err != nil {
		log.Fatalf("Failed to create fallback HTTP request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", projectToken))

	httpClient := &http.Client{}
	resp, err := httpClient.Do(req)
	if err != nil {
		log.Fatalf("Failed to send fallback HTTP request: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalf("Failed to read fallback response body: %v", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Fatalf("Fallback API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result rawBroadcastResponse
	if err := json.Unmarshal(body, &result); err != nil {
		log.Fatalf("Failed to parse fallback response JSON: %v\nBody: %s", err, string(body))
	}

	if result.Broadcast.ID == "" {
		log.Fatalf("Fallback: broadcast created but no ID returned. Response: %s", string(body))
	}

	return result.Broadcast.ID
}
