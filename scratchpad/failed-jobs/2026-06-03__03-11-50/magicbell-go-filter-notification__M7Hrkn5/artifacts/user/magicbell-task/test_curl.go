package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func main() {
	emailBase := os.Getenv("MAGICBELL_EMAIL")
	runID := os.Getenv("ZEALT_RUN_ID")
	apiKey := os.Getenv("MAGICBELL_API_KEY")
	secretKey := os.Getenv("MAGICBELL_SECRET_KEY")

	userEmail := fmt.Sprintf("%s+%s@gmail.com", emailBase, runID)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_email": userEmail,
		"api_key":    apiKey,
		"exp":        time.Now().Add(time.Hour * 24).Unix(),
		"iat":        time.Now().Unix(),
	})

	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		log.Fatal(err)
	}

	cmd := exec.Command("curl", "-s", "-v", "https://api.magicbell.com/v2/notifications",
		"-H", "Authorization: Bearer "+tokenString)
	
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
}
