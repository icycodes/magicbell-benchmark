import os
import shutil

PROJECT_DIR = "/home/user/task"

def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."

def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."

def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."

def test_magicbell_js_installed():
    package_json = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(package_json), "package.json not found in project directory."
    
    with open(package_json, "r") as f:
        content = f.read()
    
    assert "magicbell-js" in content, "magicbell-js is not listed in package.json."
