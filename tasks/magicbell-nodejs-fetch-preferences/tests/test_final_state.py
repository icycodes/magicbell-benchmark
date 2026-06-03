import os
import subprocess
import json
import pytest

PROJECT_DIR = "/home/user/magicbell-nodejs-fetch-preferences"
LOG_FILE = os.path.join(PROJECT_DIR, "output.log")

def test_script_execution_and_output():
    """Run the script and verify it creates the expected JSON output."""
    # Ensure any previous log is removed
    if os.path.exists(LOG_FILE):
        os.remove(LOG_FILE)

    # Run the script
    result = subprocess.run(
        ["node", "index.js"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    
    assert result.returncode == 0, f"Script execution failed. stderr: {result.stderr}\nstdout: {result.stdout}"
    
    # Check if log file exists
    assert os.path.isfile(LOG_FILE), f"Expected log file {LOG_FILE} was not created."
    
    # Verify JSON content
    with open(LOG_FILE, "r") as f:
        content = f.read()
        
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        pytest.fail(f"Log file does not contain valid JSON. Error: {e}\nContent: {content}")
        
    # Verify the presence of categories array
    assert "categories" in data, f"Expected 'categories' key in the JSON output. Got: {list(data.keys())}"
    assert isinstance(data["categories"], list), "Expected 'categories' to be a list."
