import os
import json
import time
import subprocess
import jwt
import pytest

PROJECT_DIR = "/home/user/myproject"

def test_list_notifications_pagination():
    run_id = os.environ.get("ZEALT_RUN_ID", "default-run-id")
    magicbell_email = os.environ.get("MAGICBELL_EMAIL", "test@gmail.com")
    
    if "@" in magicbell_email:
        username, domain = magicbell_email.split("@", 1)
        user_email = f"{username}+{run_id}@{domain}"
    else:
        user_email = f"{magicbell_email}+{run_id}@gmail.com"
        
    user_external_id = f"user-{run_id}"
    
    # 1. Setup user and broadcasts using a temporary Node.js script
    setup_script = f"""
const {{ Client }} = require('magicbell-js/project-client');
const client = new Client({{ token: process.env.MAGICBELL_PROJECT_TOKEN }});

async function setup() {{
    await client.users.saveUser({{
        externalId: '{user_external_id}',
        email: '{user_email}',
    }});
    
    for (let i = 1; i <= 4; i++) {{
        await client.broadcasts.createBroadcast({{
            title: `Broadcast ${{i}}`,
            recipients: [{{ externalId: '{user_external_id}' }}]
        }});
        await new Promise(r => setTimeout(r, 1000));
    }}
}}
setup().catch(err => {{ console.error(err); process.exit(1); }});
"""
    setup_path = os.path.join(PROJECT_DIR, "test_setup.js")
    with open(setup_path, "w") as f:
        f.write(setup_script)
        
    result = subprocess.run(["node", "test_setup.js"], cwd=PROJECT_DIR, capture_output=True, text=True)
    assert result.returncode == 0, f"Setup script failed: {result.stderr}\\n{result.stdout}"
    
    # Wait for notifications to be delivered
    time.sleep(5)
    
    # 2. Generate User JWT
    api_key = os.environ["MAGICBELL_API_KEY"]
    secret_key = os.environ["MAGICBELL_SECRET_KEY"]
    
    payload = {
        "user_external_id": user_external_id,
        "user_email": user_email,
        "api_key": api_key,
        "exp": int(time.time()) + 3600
    }
    user_jwt = jwt.encode(payload, secret_key, algorithm="HS256")
    
    # 3. Fetch notifications to get the IDs using another Node.js script
    fetch_script = f"""
const {{ Client }} = require('magicbell-js/user-client');
const client = new Client({{ token: '{user_jwt}' }});

async function fetch() {{
    const page1 = await client.notifications.listNotifications({{ limit: 2 }});
    if (page1.data.length < 2) throw new Error("Not enough notifications in page 1");
    const id1 = page1.data[0].id;
    const id2 = page1.data[1].id;
    
    const page2 = await client.notifications.listNotifications({{ limit: 2, startingAfter: id2 }});
    if (page2.data.length < 2) throw new Error("Not enough notifications in page 2");
    const id3 = page2.data[0].id;
    const id4 = page2.data[1].id;
    
    console.log(JSON.stringify({{ id1, id2, id3, id4 }}));
}}
fetch().catch(err => {{ console.error(err); process.exit(1); }});
"""
    fetch_path = os.path.join(PROJECT_DIR, "test_fetch.js")
    with open(fetch_path, "w") as f:
        f.write(fetch_script)
        
    result = subprocess.run(["node", "test_fetch.js"], cwd=PROJECT_DIR, capture_output=True, text=True)
    assert result.returncode == 0, f"Fetch script failed: {result.stderr}\\n{result.stdout}"
    
    try:
        ids = json.loads(result.stdout.strip())
    except json.JSONDecodeError:
        pytest.fail(f"Failed to parse fetch script output: {result.stdout}")
        
    id1, id2, id3, id4 = ids["id1"], ids["id2"], ids["id3"], ids["id4"]
    
    # 4. Run the user's script
    env = os.environ.copy()
    env["USER_JWT"] = user_jwt
    
    script_path = os.path.join(PROJECT_DIR, "list_notifications.js")
    assert os.path.isfile(script_path), f"list_notifications.js not found at {script_path}"
    
    result = subprocess.run(["node", "list_notifications.js"], cwd=PROJECT_DIR, env=env, capture_output=True, text=True)
    assert result.returncode == 0, f"list_notifications.js failed: {result.stderr}\\n{result.stdout}"
    
    stdout = result.stdout.strip()
    
    expected_page1 = f"Page 1: {id1}, {id2}"
    expected_page2 = f"Page 2: {id3}, {id4}"
    
    assert expected_page1 in stdout, f"Expected '{expected_page1}' in stdout, got: {stdout}"
    assert expected_page2 in stdout, f"Expected '{expected_page2}' in stdout, got: {stdout}"
