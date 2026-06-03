import os
import shutil
import pytest
import subprocess

PROJECT_DIR = "/home/user/task"

def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."
    assert shutil.which("npm") is not None, "npm binary not found in PATH."

def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."

def test_magicbell_js_installed():
    package_json_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(package_json_path), f"package.json not found in {PROJECT_DIR}."
    
    # Check if magicbell-js is installed
    result = subprocess.run(
        ["npm", "list", "magicbell-js"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True
    )
    assert result.returncode == 0, "magicbell-js is not installed in the project."