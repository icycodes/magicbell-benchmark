import os
import sys
import json
import subprocess

def main():
    # 1. Read environment variables
    run_id_env = os.environ.get("ZEALT_RUN_ID")
    email_env = os.environ.get("MAGICBELL_EMAIL")
    project_token_env = os.environ.get("MAGICBELL_PROJECT_TOKEN")
    api_key_env = os.environ.get("MAGICBELL_API_KEY")
    secret_key_env = os.environ.get("MAGICBELL_SECRET_KEY")

    if not all([run_id_env, email_env, project_token_env, api_key_env, secret_key_env]):
        print("Error: Missing required environment variables.", file=sys.stderr)
        print(f"ZEALT_RUN_ID: {run_id_env}", file=sys.stderr)
        print(f"MAGICBELL_EMAIL: {email_env}", file=sys.stderr)
        print(f"MAGICBELL_PROJECT_TOKEN: {'set' if project_token_env else 'not set'}", file=sys.stderr)
        print(f"MAGICBELL_API_KEY: {'set' if api_key_env else 'not set'}", file=sys.stderr)
        print(f"MAGICBELL_SECRET_KEY: {'set' if secret_key_env else 'not set'}", file=sys.stderr)
        sys.exit(1)

    print(f"Successfully read environment variables. Run ID: {run_id_env}")

    # 2. Compute plus-addressed recipient email
    if "@" not in email_env:
        print(f"Error: MAGICBELL_EMAIL '{email_env}' does not contain '@'", file=sys.stderr)
        sys.exit(1)
    
    local_part, domain_part = email_env.split("@", 1)
    recipient_email = f"{local_part}+trigger-cli-{run_id_env}@{domain_part}"
    print(f"Computed recipient email: {recipient_email}")

    # 3. Authenticate CLI non-interactively
    print("Logging into MagicBell CLI...")
    login_cmd = [
        "magicbell", "login", "--manual",
        "--email", email_env,
        "--jwt", project_token_env,
        "--api-key", api_key_env,
        "--secret-key", secret_key_env
    ]
    
    try:
        login_res = subprocess.run(login_cmd, capture_output=True, text=True, check=True)
        print("Login stdout:", login_res.stdout)
        print("Login stderr:", login_res.stderr)
    except subprocess.CalledProcessError as e:
        print(f"Error during login: {e}", file=sys.stderr)
        print(f"Stdout: {e.stdout}", file=sys.stderr)
        print(f"Stderr: {e.stderr}", file=sys.stderr)
        sys.exit(1)

    # 4. Upsert workflow definition
    workflow_key = f"wf-trigger-cli-{run_id_env}"
    workflow_def = {
        "key": workflow_key,
        "steps": [
            {
                "command": "broadcast",
                "input": {
                    "title": "Workflow Trigger CLI - {{ marker }}",
                    "content": "This workflow run was triggered via the MagicBell CLI.",
                    "recipients": [
                        {
                            "email": "{{ recipient_email }}"
                        }
                    ]
                }
            }
        ]
    }
    workflow_def_json = json.dumps(workflow_def)
    print(f"Upserting workflow with key {workflow_key}...")
    print(f"Workflow Definition: {workflow_def_json}")

    save_cmd = [
        "magicbell", "workflow", "save",
        "--data", workflow_def_json
    ]

    try:
        save_res = subprocess.run(save_cmd, capture_output=True, text=True, check=True)
        print("Save stdout:", save_res.stdout)
        print("Save stderr:", save_res.stderr)
    except subprocess.CalledProcessError as e:
        print(f"Error during workflow save: {e}", file=sys.stderr)
        print(f"Stdout: {e.stdout}", file=sys.stderr)
        print(f"Stderr: {e.stderr}", file=sys.stderr)
        sys.exit(1)

    # 5. Trigger workflow run
    marker = f"trigger-cli-{run_id_env}"
    trigger_data = {
        "key": workflow_key,
        "input": {
            "marker": marker,
            "recipient_email": recipient_email
        }
    }
    trigger_data_json = json.dumps(trigger_data)
    print(f"Triggering workflow run for key {workflow_key}...")
    print(f"Trigger payload: {trigger_data_json}")

    trigger_cmd = [
        "magicbell", "workflow", "create_run",
        "--data", trigger_data_json
    ]

    try:
        trigger_res = subprocess.run(trigger_cmd, capture_output=True, text=True, check=True)
        print("Trigger stdout:", trigger_res.stdout)
        print("Trigger stderr:", trigger_res.stderr)
    except subprocess.CalledProcessError as e:
        print(f"Error during workflow create_run: {e}", file=sys.stderr)
        print(f"Stdout: {e.stdout}", file=sys.stderr)
        print(f"Stderr: {e.stderr}", file=sys.stderr)
        sys.exit(1)

    # 6. Parse JSON returned by create_run
    lines = [line.strip() for line in trigger_res.stdout.split("\n") if line.strip()]
    response_json = None
    for line in reversed(lines):
        try:
            data = json.loads(line)
            if isinstance(data, dict) and ("id" in data or "data" in data):
                response_json = data
                break
        except json.JSONDecodeError:
            continue

    if response_json is None:
        print(f"Error: Could not find valid JSON in create_run output.", file=sys.stderr)
        print(f"Raw output: {trigger_res.stdout}", file=sys.stderr)
        sys.exit(1)

    print("Parsed Trigger Response JSON successfully.")

    run_id = None
    if isinstance(response_json, dict):
        if "data" in response_json and isinstance(response_json["data"], dict) and "id" in response_json["data"]:
            run_id = response_json["data"]["id"]
        elif "id" in response_json:
            run_id = response_json["id"]

    if not run_id:
        print("Error: Could not extract run ID from trigger response JSON.", file=sys.stderr)
        print(f"JSON structure: {response_json}", file=sys.stderr)
        sys.exit(1)

    print(f"Extracted Workflow Run ID: {run_id}")

    # 7. Write run ID to output.log
    output_log_path = "/home/user/magicbell-task/output.log"
    try:
        with open(output_log_path, "w") as f:
            f.write(f"Workflow Run ID: {run_id}\n")
        print(f"Successfully wrote run ID to {output_log_path}")
    except Exception as e:
        print(f"Error writing to output log: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
