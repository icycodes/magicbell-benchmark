import os
import subprocess
import pytest

PROJECT_DIR = "/home/user/myproject"

def test_component_file_exists():
    """Verify that the component file exists."""
    component_path = os.path.join(PROJECT_DIR, "src", "NotificationInboxWithTabs.jsx")
    assert os.path.isfile(component_path), f"Component file not found at {component_path}"

def test_jest_suite_passes():
    """Run the Jest test suite to verify component props, stores, and tabs configuration."""
    result = subprocess.run(
        ["npx", "jest", "verify.test.js", "--no-cache"],
        capture_output=True,
        text=True,
        cwd=PROJECT_DIR
    )
    assert result.returncode == 0, (
        f"Jest test suite failed.\n"
        f"STDOUT:\n{result.stdout}\n"
        f"STDERR:\n{result.stderr}"
    )
