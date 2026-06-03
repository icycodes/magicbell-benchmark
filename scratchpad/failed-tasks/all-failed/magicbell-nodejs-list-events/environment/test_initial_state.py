import os
import subprocess
import json

PROJECT_DIR = "/home/user/magicbell-task"

def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."

def test_package_json_exists():
    package_json_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(package_json_path), f"File {package_json_path} does not exist."

def test_magicbell_js_in_dependencies():
    package_json_path = os.path.join(PROJECT_DIR, "package.json")
    with open(package_json_path, 'r') as f:
        data = json.load(f)
    deps = data.get("dependencies", {})
    assert "magicbell-js" in deps, "magicbell-js is not in package.json dependencies."

def test_node_available():
    result = subprocess.run(["node", "-v"], capture_output=True, text=True)
    assert result.returncode == 0, "Node.js is not available."

def test_npm_available():
    result = subprocess.run(["npm", "-v"], capture_output=True, text=True)
    assert result.returncode == 0, "npm is not available."
