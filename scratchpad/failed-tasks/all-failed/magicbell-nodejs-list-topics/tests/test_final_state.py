import os
import subprocess
import pytest

PROJECT_DIR = "/home/user/myproject"

def test_script_exists():
    script_path = os.path.join(PROJECT_DIR, "index.js")
    assert os.path.isfile(script_path), f"Script not found at {script_path}"

def test_script_output():
    run_id = os.environ.get("ZEALT_RUN_ID")
    assert run_id, "ZEALT_RUN_ID environment variable is not set."
    
    # Run npm install just in case dependencies are missing
    install_result = subprocess.run(
        ["npm", "install"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    assert install_result.returncode == 0, f"npm install failed: {install_result.stderr}"
    
    # Run the script
    result = subprocess.run(
        ["node", "index.js"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    
    assert result.returncode == 0, f"Script execution failed with error: {result.stderr}"
    
    expected_topic = f"test-topic-{run_id}"
    assert expected_topic in result.stdout, \
        f"Expected topic '{expected_topic}' not found in stdout. Output was:\n{result.stdout}"
