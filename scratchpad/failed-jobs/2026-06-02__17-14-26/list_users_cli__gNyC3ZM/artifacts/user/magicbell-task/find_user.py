import subprocess
import json
import os

run_id = os.environ.get('ZEALT_RUN_ID')
ext_id = f"list-users-cli-{run_id}"

starting_after = None

found_user = None

while True:
    cmd = ["magicbell", "user", "list", "--limit", "100"]
    if starting_after:
        cmd.extend(["--starting_after", starting_after])
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    # The output might have debug logs first, then JSON.
    # We should find the line starting with {"links"
    lines = result.stdout.strip().split('\n')
    json_line = None
    for line in lines:
        if line.startswith('{"links"'):
            json_line = line
            break
            
    if not json_line:
        print("Raw output:", result.stdout)
        break
        
    data = json.loads(json_line)
    users = data.get('data', [])
    if not users:
        break
        
    for u in users:
        if u.get('external_id') == ext_id:
            found_user = u
            break
            
    if found_user:
        break
        
    # pagination
    next_link = data.get('links', {}).get('next')
    if next_link:
        # extract starting_after from next_link
        import urllib.parse
        parsed = urllib.parse.urlparse(next_link)
        qs = urllib.parse.parse_qs(parsed.query)
        starting_after = qs.get('starting_after', [None])[0]
        if not starting_after:
            break
    else:
        break

if found_user:
    with open('/home/user/magicbell-task/output.log', 'w') as f:
        f.write(f"User ID: {found_user['id']}\n")
        f.write(f"External ID: {found_user['external_id']}\n")
    print("Found user and wrote to output.log")
else:
    print("User not found")
