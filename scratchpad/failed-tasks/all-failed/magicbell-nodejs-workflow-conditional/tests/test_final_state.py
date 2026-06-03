import os
import subprocess
import json
import pytest

PROJECT_DIR = "/home/user/task"

def test_run_index_js():
    """Run the executor's index.js script."""
    result = subprocess.run(
        ["node", "index.js"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0, f"node index.js failed: {result.stderr}"

def test_workflow_created_and_configured():
    """Verify the workflow definition using a small Node.js script."""
    run_id = os.environ.get("ZEALT_RUN_ID", "default-run-id")
    workflow_key = f"conditional-workflow-{run_id}"
    
    verify_script = f"""
import {{ Client }} from 'magicbell-js/project-client';

const client = new Client({{
  token: process.env.MAGICBELL_PROJECT_TOKEN,
}});

(async () => {{
  try {{
    const res = await client.workflows.fetchWorkflow({{ key: '{workflow_key}' }});
    console.log(JSON.stringify(res.data));
  }} catch (e) {{
    console.error(e);
    process.exit(1);
  }}
}})();
"""
    verify_script_path = os.path.join(PROJECT_DIR, "verify.js")
    with open(verify_script_path, "w") as f:
        f.write(verify_script)
        
    result = subprocess.run(
        ["node", "verify.js"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0, f"Failed to fetch workflow: {result.stderr}\nStdout: {result.stdout}"
    
    try:
        workflow_data = json.loads(result.stdout)
    except json.JSONDecodeError:
        pytest.fail(f"Failed to parse workflow JSON: {result.stdout}")
        
    assert "steps" in workflow_data, "Workflow definition is missing 'steps' array."
    steps = workflow_data["steps"]
    assert len(steps) == 1, f"Expected exactly 1 step, got {len(steps)}."
    
    step = steps[0]
    assert step.get("command") == "broadcast", f"Expected step command to be 'broadcast', got {step.get('command')}."
    
    condition = step.get("if")
    assert condition is not None, "Step is missing the 'if' condition."
    assert "plan" in condition and "premium" in condition, f"Expected 'if' condition to check for plan and premium, got: {condition}"
