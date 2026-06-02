import os
import sys
import time
import jwt
import requests

def main():
    # 1. Read environment variables
    zealt_run_id = os.environ.get("ZEALT_RUN_ID")
    magicbell_email = os.environ.get("MAGICBELL_EMAIL")
    project_token = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    api_key = os.environ.get("MAGICBELL_API_KEY")
    secret_key = os.environ.get("MAGICBELL_SECRET_KEY")

    missing = []
    for var, val in [
        ("ZEALT_RUN_ID", zealt_run_id),
        ("MAGICBELL_EMAIL", magicbell_email),
        ("MAGICBELL_PROJECT_TOKEN", project_token),
        ("MAGICBELL_API_KEY", api_key),
        ("MAGICBELL_SECRET_KEY", secret_key)
    ]:
        if not val:
            missing.append(var)
    
    if missing:
        print(f"Error: Missing environment variables: {', '.join(missing)}")
        sys.exit(1)

    # 2. Compute user email
    local, domain = magicbell_email.split("@", 1)
    user_email = f"{local}+jwt-python-{zealt_run_id}@{domain}"

    # 3. Compute user external id
    user_external_id = f"user-jwt-python-{zealt_run_id}"

    # 4. Upsert the MagicBell user
    # Endpoint: https://api.magicbell.com/v2/users
    # Method: PUT (flat payload)
    # Auth: Authorization: Bearer $MAGICBELL_PROJECT_TOKEN
    url = "https://api.magicbell.com/v2/users"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    payload_user = {
        "email": user_email,
        "external_id": user_external_id,
        "first_name": "Python",
        "last_name": "JWT"
    }

    print(f"Upserting MagicBell user with email '{user_email}' and external_id '{user_external_id}'...")
    response = requests.put(url, json=payload_user, headers=headers)
    if response.status_code != 200:
        print(f"Error: Failed to upsert MagicBell user. Status code: {response.status_code}")
        print(response.text)
        sys.exit(1)
    
    print("MagicBell user upserted successfully.")
    print(f"Response: {response.text}")

    # 5. Build the JWT payload
    # Expiration: roughly one year in the future (365 days)
    exp_time = int(time.time()) + 365 * 24 * 60 * 60
    payload_jwt = {
        "user_email": user_email,
        "user_external_id": user_external_id,
        "api_key": api_key,
        "exp": exp_time
    }

    # 6. HS256-sign the payload with MAGICBELL_SECRET_KEY using PyJWT
    token = jwt.encode(payload_jwt, secret_key, algorithm="HS256")
    if isinstance(token, bytes):
        token = token.decode("utf-8")

    print(f"Generated User JWT: {token}")

    # 7. Write the resulting token to /home/user/myproject/output.log
    output_dir = "/home/user/myproject"
    os.makedirs(output_dir, exist_ok=True)
    log_path = os.path.join(output_dir, "output.log")
    with open(log_path, "w") as f:
        f.write(f"User JWT: {token}\n")
    print(f"Successfully wrote token to {log_path}")

    # 8. Verify the token against the MagicBell User Client REST API (/v2/notifications)
    verify_url = "https://api.magicbell.com/v2/notifications"
    verify_headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    print("Verifying the generated User JWT against /v2/notifications...")
    verify_response = requests.get(verify_url, headers=verify_headers)
    print(f"Verification response status code: {verify_response.status_code}")
    if verify_response.status_code == 200:
        print("Success: Token is valid and successfully authenticated against the MagicBell User Client REST API!")
    else:
        print(f"Error: Verification failed. Response: {verify_response.text}")
        sys.exit(1)

if __name__ == "__main__":
    main()
