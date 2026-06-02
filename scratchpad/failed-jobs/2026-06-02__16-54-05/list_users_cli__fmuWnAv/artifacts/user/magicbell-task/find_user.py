import os
import sys
import json
import subprocess
import urllib.parse

def run_command(cmd):
    try:
        result = subprocess.run(cmd, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {cmd}", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        sys.exit(1)

def main():
    # Read variables from environment
    run_id = os.environ.get("ZEALT_RUN_ID")
    if not run_id:
        print("Error: ZEALT_RUN_ID is not set in environment", file=sys.stderr)
        sys.exit(1)
    
    target_external_id = f"list-users-cli-{run_id}"
    print(f"Searching for user with external_id: {target_external_id}")
    
    starting_after = None
    user_found = None
    page_count = 0
    
    while not user_found:
        page_count += 1
        print(f"Fetching page {page_count}...")
        
        cmd = "magicbell user list"
        if starting_after:
            cmd += f" --starting_after '{starting_after}'"
            
        stdout = run_command(cmd)
        
        try:
            res = json.loads(stdout)
        except json.JSONDecodeError as e:
            print("Failed to parse JSON response from magicbell user list", file=sys.stderr)
            print(stdout, file=sys.stderr)
            sys.exit(1)
            
        data = res.get("data", [])
        for user in data:
            if user.get("external_id") == target_external_id:
                user_found = user
                break
                
        if user_found:
            break
            
        # Check if there's a next page
        links = res.get("links", {})
        next_url = links.get("next")
        if not next_url:
            print("User not found and no more pages left.", file=sys.stderr)
            sys.exit(1)
            
        # Extract starting_after from next_url
        parsed_url = urllib.parse.urlparse(next_url)
        query_params = urllib.parse.parse_qs(parsed_url.query)
        starting_after_list = query_params.get("starting_after")
        if not starting_after_list:
            print("Could not extract starting_after from next URL:", next_url, file=sys.stderr)
            sys.exit(1)
            
        starting_after = starting_after_list[0]
        
    print(f"User found! ID: {user_found['id']}, External ID: {user_found['external_id']}")
    
    # Ensure directory exists
    log_dir = "/home/user/magicbell-task"
    os.makedirs(log_dir, exist_ok=True)
    
    log_file_path = os.path.join(log_dir, "output.log")
    with open(log_file_path, "w") as f:
        f.write(f"User ID: {user_found['id']}\n")
        f.write(f"External ID: {user_found['external_id']}\n")
        
    print(f"Successfully wrote credentials to {log_file_path}")

if __name__ == "__main__":
    main()
