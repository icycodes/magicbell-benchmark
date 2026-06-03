import os
import sys
import json
import subprocess

def main():
    # 1. Read environment variables
    run_id = os.environ.get("ZEALT_RUN_ID")
    if not run_id:
        print("Error: ZEALT_RUN_ID environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    magicbell_email = os.environ.get("MAGICBELL_EMAIL")
    if not magicbell_email:
        print("Error: MAGICBELL_EMAIL environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    jwt = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    api_key = os.environ.get("MAGICBELL_API_KEY")
    secret_key = os.environ.get("MAGICBELL_SECRET_KEY")

    if not all([jwt, api_key, secret_key]):
        print("Error: Missing MagicBell credentials (MAGICBELL_PROJECT_TOKEN, MAGICBELL_API_KEY, or MAGICBELL_SECRET_KEY).", file=sys.stderr)
        sys.exit(1)

    # 2. Parse the email prefix and construct the email address
    email_prefix = magicbell_email.split("@")[0]
    constructed_email = f"{email_prefix}+{run_id}@gmail.com"

    # 3. Construct user fields
    external_id = f"user-{run_id}"
    first_name = "TestUser"
    last_name = run_id

    print(f"Run ID: {run_id}")
    print(f"Email Prefix: {email_prefix}")
    print(f"Constructed Email: {constructed_email}")
    print(f"External ID: {external_id}")

    # 4. Authenticate with MagicBell CLI using login command
    login_cmd = [
        "magicbell", "login", "--manual",
        "--email", magicbell_email,
        "--jwt", jwt,
        "--api-key", api_key,
        "--secret-key", secret_key
    ]
    
    print("Running magicbell login...")
    login_res = subprocess.run(login_cmd, capture_output=True, text=True)
    if login_res.returncode != 0:
        print(f"Login failed:\nSTDOUT: {login_res.stdout}\nSTDERR: {login_res.stderr}", file=sys.stderr)
        sys.exit(1)
    print("Login successful!")

    # 5. Save the user
    user_data = {
        "external_id": external_id,
        "email": constructed_email,
        "first_name": first_name,
        "last_name": last_name
    }
    
    user_data_json = json.dumps(user_data)
    save_cmd = [
        "magicbell", "user", "save",
        "--data", user_data_json
    ]
    
    print("Running magicbell user save...")
    save_res = subprocess.run(save_cmd, capture_output=True, text=True)
    if save_res.returncode != 0:
        print(f"User save failed:\nSTDOUT: {save_res.stdout}\nSTDERR: {save_res.stderr}", file=sys.stderr)
        sys.exit(1)
    
    print("User save completed!")
    
    # 6. Parse output to find user ID
    # The output might have multiple lines, or be JSON directly. Let's inspect stdout.
    stdout = save_res.stdout.strip()
    print(f"CLI Output:\n{stdout}")
    
    user_id = None
    # Let's try parsing each line as JSON or finding a JSON-like substring.
    for line in stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            data = json.loads(line)
            if isinstance(data, dict) and "id" in data:
                user_id = data["id"]
                break
        except json.JSONDecodeError:
            continue

    if not user_id:
        print("Error: Could not extract user ID from output.", file=sys.stderr)
        sys.exit(1)

    # 7. Write to output.log
    log_dir = "/home/user/myproject"
    os.makedirs(log_dir, exist_ok=True)
    log_file_path = os.path.join(log_dir, "output.log")
    
    with open(log_file_path, "w") as f:
        f.write(f"User ID: {user_id}\n")
        
    print(f"Successfully wrote User ID to {log_file_path}: User ID: {user_id}")

if __name__ == "__main__":
    main()
