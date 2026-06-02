import os
import sys
import json
import subprocess
import requests
import hmac
import hashlib
import base64

def compute_hmac(secret, message):
    h = hmac.new(secret.encode('utf-8'), message.encode('utf-8'), hashlib.sha256)
    return base64.b64encode(h.digest()).decode('utf-8')

def main():
    # 1. Read env variables
    zealt_run_id = os.environ.get("ZEALT_RUN_ID")
    magicbell_email = os.environ.get("MAGICBELL_EMAIL")
    magicbell_api_key = os.environ.get("MAGICBELL_API_KEY")
    magicbell_secret_key = os.environ.get("MAGICBELL_SECRET_KEY")
    magicbell_project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    
    if not all([zealt_run_id, magicbell_email, magicbell_api_key, magicbell_secret_key, magicbell_project_token]):
        print("Missing environment variables!")
        sys.exit(1)
        
    print(f"ZEALT_RUN_ID: {zealt_run_id}")
    print(f"MAGICBELL_EMAIL: {magicbell_email}")
    
    # 2. Compute recipient emails
    if "@" not in magicbell_email:
        print("Invalid MAGICBELL_EMAIL format!")
        sys.exit(1)
    local, domain = magicbell_email.split("@", 1)
    
    email_1 = f"{local}+topic-subs-cli-1-{zealt_run_id}@{domain}"
    email_2 = f"{local}+topic-subs-cli-2-{zealt_run_id}@{domain}"
    
    print(f"Computed Email 1: {email_1}")
    print(f"Computed Email 2: {email_2}")
    
    # 3. Define user attributes
    user_1 = {
        "external_id": f"user-topic-subs-cli-1-{zealt_run_id}",
        "email": email_1,
        "first_name": "TopicSubsCli",
        "last_name": f"One-{zealt_run_id}"
    }
    
    user_2 = {
        "external_id": f"user-topic-subs-cli-2-{zealt_run_id}",
        "email": email_2,
        "first_name": "TopicSubsCli",
        "last_name": f"Two-{zealt_run_id}"
    }
    
    # 4. Upsert User 1 via magicbell user save
    print("Saving User 1...")
    data_1 = json.dumps(user_1)
    res_1 = subprocess.run(
        ["magicbell", "user", "save", "--data", data_1],
        capture_output=True,
        text=True
    )
    print("User 1 CLI output:", res_1.stdout)
    if res_1.returncode != 0:
        print("Failed to save User 1:", res_1.stderr)
        sys.exit(1)
        
    # 5. Upsert User 2 via magicbell user save
    print("Saving User 2...")
    data_2 = json.dumps(user_2)
    res_2 = subprocess.run(
        ["magicbell", "user", "save", "--data", data_2],
        capture_output=True,
        text=True
    )
    print("User 2 CLI output:", res_2.stdout)
    if res_2.returncode != 0:
        print("Failed to save User 2:", res_2.stderr)
        sys.exit(1)
        
    # 6. Subscribe users to the topic
    topic_key = f"topic-cli-{zealt_run_id}"
    print(f"Subscribing users to topic: {topic_key}")
    
    for user in [user_1, user_2]:
        ext_id = user["external_id"]
        user_hmac = compute_hmac(magicbell_secret_key, ext_id)
        
        headers = {
            "X-MAGICBELL-API-KEY": magicbell_api_key,
            "X-MAGICBELL-USER-EXTERNAL-ID": ext_id,
            "X-MAGICBELL-USER-HMAC": user_hmac,
            "Content-Type": "application/json"
        }
        body = {
            "subscription": {
                "topic": topic_key,
                "categories": [
                    {
                        "slug": "*"
                    }
                ]
            }
        }
        print(f"Subscribing {ext_id} (HMAC: {user_hmac})...")
        sub_res = requests.post("https://api.magicbell.com/subscriptions", headers=headers, json=body)
        print(f"Subscription status code: {sub_res.status_code}")
        print(f"Subscription response: {sub_res.text}")
        if sub_res.status_code not in (200, 201, 204):
            print(f"Failed to subscribe user {ext_id}")
            sys.exit(1)
            
    # 7. Create broadcast
    broadcast_payload = {
        "title": f"Topic Subs CLI - {zealt_run_id}",
        "content": "This is a broadcast to topic subscribers",
        "topic": topic_key,
        "recipients": [
            {
                "topic": {
                    "subscribers": True
                }
            }
        ]
    }
    
    print("Creating broadcast...")
    broadcast_data = json.dumps(broadcast_payload)
    b_res = subprocess.run(
        ["magicbell", "broadcast", "create", "--data", broadcast_data],
        capture_output=True,
        text=True
    )
    print("Broadcast CLI output:", b_res.stdout)
    if b_res.returncode != 0:
        print("Failed to create broadcast:", b_res.stderr)
        sys.exit(1)
        
    # Parse output to extract ID
    broadcast_id = None
    for line in b_res.stdout.splitlines():
        if not line.strip():
            continue
        try:
            parsed = json.loads(line)
            if "id" in parsed:
                broadcast_id = parsed["id"]
                break
        except json.JSONDecodeError:
            continue
            
    if not broadcast_id:
        print("Could not parse broadcast ID from CLI output!")
        sys.exit(1)
        
    print(f"Extracted Broadcast ID: {broadcast_id}")
    
    # 8. Write to log file
    log_path = "/home/user/magicbell-task/output.log"
    with open(log_path, "w") as f:
        f.write(f"Broadcast ID: {broadcast_id}\n")
    print(f"Successfully wrote Broadcast ID to {log_path}")

if __name__ == "__main__":
    main()
