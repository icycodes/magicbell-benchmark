package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	pc "github.com/magicbell/magicbell-go/pkg/project-client/client"
	pconfig "github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/shared"
	"github.com/magicbell/magicbell-go/pkg/project-client/broadcasts"
	putil "github.com/magicbell/magicbell-go/pkg/project-client/util"

	uc "github.com/magicbell/magicbell-go/pkg/user-client/client"
	uconfig "github.com/magicbell/magicbell-go/pkg/user-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/user-client/notifications"
	uutil "github.com/magicbell/magicbell-go/pkg/user-client/util"
)

func main() {
	projectToken := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	apiKey := os.Getenv("MAGICBELL_API_KEY")
	secretKey := os.Getenv("MAGICBELL_SECRET_KEY")
	gmailUserName := os.Getenv("GMAIL_USER_NAME")
	runID := os.Getenv("ZEALT_RUN_ID")

	userEmail := fmt.Sprintf("%s+%s@gmail.com", gmailUserName, runID)
	userExternalID := fmt.Sprintf("user_%s", runID)

	// 1. Project Client
	pConf := pconfig.NewConfig()
	pConf.SetAccessToken(projectToken)
	pClient := pc.NewClient(pConf)

	ctx := context.Background()

	// Upsert user
	userReq := shared.User{
		Email:      putil.ToPointer(putil.Nullable[string]{Value: userEmail}),
		ExternalId: putil.ToPointer(putil.Nullable[string]{Value: userExternalID}),
	}
	_, pErr1 := pClient.Users.SaveUser(ctx, userReq)
	if pErr1 != nil {
		log.Fatalf("Failed to save user: %v", pErr1.Error())
	}

	// Send broadcast
	broadcastReq := broadcasts.Broadcast{
		Title: putil.ToPointer(fmt.Sprintf("Notification %s", runID)),
		Content: putil.ToPointer(putil.Nullable[string]{Value: fmt.Sprintf("Hello, this is a test notification for run %s!", runID)}),
		Recipients: putil.ToPointer(putil.Nullable[[]shared.User]{
			Value: []shared.User{
				{
					Email:      putil.ToPointer(putil.Nullable[string]{Value: userEmail}),
					ExternalId: putil.ToPointer(putil.Nullable[string]{Value: userExternalID}),
				},
			},
		}),
	}
	bResp, pErr2 := pClient.Broadcasts.CreateBroadcast(ctx, broadcastReq)
	if pErr2 != nil {
		log.Fatalf("Failed to create broadcast: %v", pErr2.Error())
	}
	
	fmt.Printf("Broadcast created: ID=%v\n", *bResp.Data.Id)

	// Wait for broadcast to be processed
	for i := 0; i < 5; i++ {
		time.Sleep(3 * time.Second)
		fmt.Println("Waiting for notifications to appear...")
		
		// Generate User JWT
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"user_email":       userEmail,
			"user_external_id": userExternalID,
			"api_key":          apiKey,
		})
		userJWT, err := token.SignedString([]byte(secretKey))
		if err != nil {
			log.Fatalf("Failed to sign JWT: %v", err)
		}

		// User Client
		uConf := uconfig.NewConfig()
		uConf.SetAccessToken(userJWT)
		uClient := uc.NewClient(uConf)

		// Fetch notifications
		params := notifications.ListNotificationsRequestParams{
			Limit: uutil.ToPointer(int64(10)),
		}
		notifResp, uErr := uClient.Notifications.ListNotifications(ctx, params)
		if uErr != nil {
			log.Fatalf("Failed to list notifications: %v", uErr.Error())
		}

		if notifResp.Data.Data != nil && len(notifResp.Data.Data) > 0 {
			count := len(notifResp.Data.Data)
			latestTitle := ""
			if notifResp.Data.Data[0].Title != nil {
				latestTitle = *notifResp.Data.Data[0].Title
			}
			
			// Log results
			f, err := os.Create("/home/user/myproject/output.log")
			if err != nil {
				log.Fatalf("Failed to create log file: %v", err)
			}
			defer f.Close()

			fmt.Fprintf(f, "User JWT: %s\n", userJWT)
			fmt.Fprintf(f, "Notifications Count: %d\n", count)
			fmt.Fprintf(f, "Latest Notification Title: %s\n", latestTitle)
			return
		}
	}
	log.Fatalf("Notifications did not appear after waiting")
}
