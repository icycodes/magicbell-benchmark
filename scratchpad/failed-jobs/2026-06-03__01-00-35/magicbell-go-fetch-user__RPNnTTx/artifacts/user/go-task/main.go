package main

import (
	"context"
	"flag"
	"fmt"
	"net/url"
	"os"

	"github.com/magicbell/magicbell-go/pkg/project-client/client"
	"github.com/magicbell/magicbell-go/pkg/project-client/clientconfig"
	"github.com/magicbell/magicbell-go/pkg/project-client/users"
)

func fetchUserEmail(ctx context.Context, c *client.Client, externalID string) (string, error) {
	var startingAfter *string
	for {
		params := users.ListUsersRequestParams{}
		params.SetQuery(externalID)
		if startingAfter != nil {
			params.SetStartingAfter(*startingAfter)
		}

		resp, err := c.Users.ListUsers(ctx, params)
		if err != nil {
			return "", err
		}

		for _, u := range resp.Data.Data {
			if u.ExternalId != nil && !u.ExternalId.IsNull && u.ExternalId.Value == externalID {
				if u.Email != nil && !u.Email.IsNull {
					return u.Email.Value, nil
				}
				return "", fmt.Errorf("user found but email is empty")
			}
		}

		if resp.Data.Links == nil || resp.Data.Links.Next == nil || resp.Data.Links.Next.IsNull || resp.Data.Links.Next.Value == "" {
			break
		}

		nextURL, parseErr := url.Parse(resp.Data.Links.Next.Value)
		if parseErr != nil {
			break
		}
		sa := nextURL.Query().Get("starting_after")
		if sa == "" {
			break
		}
		startingAfter = &sa
	}

	// Fallback to full pagination without Query
	startingAfter = nil
	for {
		params := users.ListUsersRequestParams{}
		if startingAfter != nil {
			params.SetStartingAfter(*startingAfter)
		}

		resp, err := c.Users.ListUsers(ctx, params)
		if err != nil {
			return "", err
		}

		for _, u := range resp.Data.Data {
			if u.ExternalId != nil && !u.ExternalId.IsNull && u.ExternalId.Value == externalID {
				if u.Email != nil && !u.Email.IsNull {
					return u.Email.Value, nil
				}
				return "", fmt.Errorf("user found but email is empty")
			}
		}

		if resp.Data.Links == nil || resp.Data.Links.Next == nil || resp.Data.Links.Next.IsNull || resp.Data.Links.Next.Value == "" {
			break
		}

		nextURL, parseErr := url.Parse(resp.Data.Links.Next.Value)
		if parseErr != nil {
			break
		}
		sa := nextURL.Query().Get("starting_after")
		if sa == "" {
			break
		}
		startingAfter = &sa
	}

	return "", fmt.Errorf("user with external ID %q not found", externalID)
}

func main() {
	externalID := flag.String("external-id", "", "The user's external ID")
	flag.Parse()

	if *externalID == "" {
		fmt.Fprintln(os.Stderr, "Error: --external-id is required")
		flag.Usage()
		os.Exit(1)
	}

	token := os.Getenv("MAGICBELL_PROJECT_TOKEN")
	if token == "" {
		fmt.Fprintln(os.Stderr, "Error: MAGICBELL_PROJECT_TOKEN environment variable is not set")
		os.Exit(1)
	}

	config := clientconfig.NewConfig()
	config.SetAccessToken(token)
	c := client.NewClient(config)

	email, err := fetchUserEmail(context.Background(), c, *externalID)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	fmt.Println(email)
}
