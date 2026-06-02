package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	projectclient "github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/broadcasts"
	projectconfig "github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	projectshared "github.com/magicbell/magicbell-go/pkg/project-client/shared"
	projectutil "github.com/magicbell/magicbell-go/pkg/project-client/util"

	userclient "github.com/magicbell/magicbell-go/pkg/user-client/client"
	userclientconfig "github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/user-client/notifications"

	"github.com/golang-jwt/jwt/v5"
)

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("required environment variable %q is not set", key)
	}
	return v
}

func main() {
	// ── 1. Read required environment variables ──────────────────────────────
	runID := mustEnv("ZEALT_RUN_ID")
	magicbellEmail := mustEnv("MAGICBELL_EMAIL")
	projectToken := mustEnv("MAGICBELL_PROJECT_TOKEN")
	apiKey := mustEnv("MAGICBELL_API_KEY")
	secretKey := mustEnv("MAGICBELL_SECRET_KEY")

	// ── 2. Derive recipient identity ────────────────────────────────────────
	parts := strings.SplitN(magicbellEmail, "@", 2)
	if len(parts) != 2 {
		log.Fatalf("MAGICBELL_EMAIL %q does not contain '@'", magicbellEmail)
	}
	local, domain := parts[0], parts[1]

	recipientEmail := fmt.Sprintf("%s+mark-read-go-%s@%s", local, runID, domain)
	recipientExternalID := fmt.Sprintf("user-mark-read-go-%s", runID)
	broadcastTitle := fmt.Sprintf("Mark Read Go Demo - %s", runID)

	fmt.Printf("Run ID:            %s\n", runID)
	fmt.Printf("Recipient email:   %s\n", recipientEmail)
	fmt.Printf("External ID:       %s\n", recipientExternalID)
	fmt.Printf("Broadcast title:   %s\n", broadcastTitle)

	ctx := context.Background()

	// ── 3. Build ProjectClient ──────────────────────────────────────────────
	pcfg := projectconfig.NewConfig()
	pcfg.SetAccessToken(projectToken)
	pc := projectclient.NewClient(pcfg)

	// ── 4. Upsert the recipient user ────────────────────────────────────────
	fmt.Println("\nUpserting user…")
	user := projectshared.User{}
	user.SetEmail(projectutil.Nullable[string]{Value: recipientEmail})
	user.SetExternalId(projectutil.Nullable[string]{Value: recipientExternalID})

	_, userErr := pc.Users.SaveUser(ctx, user)
	if userErr != nil {
		log.Fatalf("SaveUser failed: %v", userErr)
	}
	fmt.Printf("User upserted: email=%s external_id=%s\n", recipientEmail, recipientExternalID)

	// ── 5. Create a broadcast addressed to that user ────────────────────────
	fmt.Println("\nCreating broadcast…")
	recipient := projectshared.User{}
	recipient.SetEmail(projectutil.Nullable[string]{Value: recipientEmail})
	recipient.SetExternalId(projectutil.Nullable[string]{Value: recipientExternalID})

	bc := broadcasts.Broadcast{}
	bc.SetTitle(broadcastTitle)
	bc.SetRecipients(projectutil.Nullable[[]projectshared.User]{Value: []projectshared.User{recipient}})

	bcResp, bcErr := pc.Broadcasts.CreateBroadcast(ctx, bc)
	if bcErr != nil {
		log.Fatalf("CreateBroadcast failed: %v", bcErr)
	}
	broadcastID := ""
	if bcResp != nil && bcResp.Data.Id != nil {
		broadcastID = *bcResp.Data.Id
	}
	fmt.Printf("Broadcast created: id=%s title=%s\n", broadcastID, broadcastTitle)

	// ── 6. Mint a User JWT (HS256) ──────────────────────────────────────────
	fmt.Println("\nMinting User JWT…")
	claims := jwt.MapClaims{
		"user_email":       recipientEmail,
		"user_external_id": recipientExternalID,
		"api_key":          apiKey,
		"exp":              time.Now().Add(365 * 24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	userJWT, jwtErr := token.SignedString([]byte(secretKey))
	if jwtErr != nil {
		log.Fatalf("JWT signing failed: %v", jwtErr)
	}
	fmt.Println("User JWT minted successfully.")

	// ── 7. Build UserClient ─────────────────────────────────────────────────
	ucfg := userclientconfig.NewConfig()
	ucfg.SetAccessToken(userJWT)
	uc := userclient.NewClient(ucfg)

	// ── 8. Poll for the notification (up to 60 s) ───────────────────────────
	fmt.Println("\nPolling for notification…")
	var notificationID string
	deadline := time.Now().Add(60 * time.Second)

	for time.Now().Before(deadline) {
		params := notifications.ListNotificationsRequestParams{}
		params.SetLimit(50)

		resp, listErr := uc.Notifications.ListNotifications(ctx, params)
		if listErr != nil {
			fmt.Printf("  ListNotifications error (retrying): %v\n", listErr)
			time.Sleep(3 * time.Second)
			continue
		}

		if resp != nil {
			for _, n := range resp.Data.Data {
				if n.Title != nil && *n.Title == broadcastTitle {
					if n.Id != nil {
						notificationID = *n.Id
					}
					break
				}
			}
		}

		if notificationID != "" {
			break
		}

		fmt.Printf("  Notification not found yet, waiting 3 s… (deadline in %.0f s)\n",
			time.Until(deadline).Seconds())
		time.Sleep(3 * time.Second)
	}

	if notificationID == "" {
		log.Fatalf("Notification with title %q not found within 60 seconds", broadcastTitle)
	}
	fmt.Printf("Found notification: id=%s\n", notificationID)

	// ── 9. Mark the notification as read ────────────────────────────────────
	fmt.Println("\nMarking notification as read…")
	_, markErr := uc.Notifications.MarkNotificationRead(ctx, notificationID)
	if markErr != nil {
		log.Fatalf("MarkNotificationRead failed: %v", markErr)
	}
	fmt.Printf("Notification %s marked as read.\n", notificationID)

	// ── 10. Write output log ─────────────────────────────────────────────────
	logLine := fmt.Sprintf("Notification ID: %s\n", notificationID)
	logPath := "/home/user/myproject/output.log"
	if err := os.WriteFile(logPath, []byte(logLine), 0644); err != nil {
		log.Fatalf("Failed to write %s: %v", logPath, err)
	}
	fmt.Printf("\nOutput written to %s\n", logPath)
	fmt.Print(logLine)
}
