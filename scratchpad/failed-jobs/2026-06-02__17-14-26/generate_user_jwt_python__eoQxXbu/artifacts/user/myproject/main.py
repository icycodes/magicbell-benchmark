import os
import time
import requests
import jwt

def main():
    run_id = os.environ.get('ZEALT_RUN_ID', '')
    email = os.environ.get('MAGICBELL_EMAIL', '')
    project_token = os.environ.get('MAGICBELL_PROJECT_TOKEN', '')
    api_key = os.environ.get('MAGICBELL_API_KEY', '')
    secret_key = os.environ.get('MAGICBELL_SECRET_KEY', '')

    local_part, domain_part = email.split('@', 1)
    user_email = f"{local_part}+jwt-python-{run_id}@{domain_part}"
    user_external_id = f"user-jwt-python-{run_id}"

    # Upsert user
    url = "https://api.magicbell.com/users"
    headers = {
        "Authorization": f"Bearer {project_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "user": {
            "external_id": user_external_id,
            "email": user_email,
            "first_name": "Test",
            "last_name": "User"
        }
    }
    
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()

    # Generate User JWT
    jwt_payload = {
        "user_email": user_email,
        "user_external_id": user_external_id,
        "api_key": api_key,
        "exp": int(time.time()) + 365 * 24 * 3600
    }
    
    token = jwt.encode(jwt_payload, secret_key, algorithm='HS256')
    
    with open('/home/user/myproject/output.log', 'w') as f:
        f.write(f"User JWT: {token}\n")

if __name__ == "__main__":
    main()
