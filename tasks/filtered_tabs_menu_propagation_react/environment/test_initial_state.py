import os
import shutil
import json
import pytest

PROJECT_DIR = "/home/user/myproject"

def test_node_and_npm_available():
    assert shutil.which("node") is not None, "Node.js binary not found in PATH."
    assert shutil.which("npm") is not None, "npm binary not found in PATH."

def test_project_directory_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."

def test_package_json_exists():
    package_json_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(package_json_path), f"package.json not found at {package_json_path}."

def test_magicbell_react_dependency():
    package_json_path = os.path.join(PROJECT_DIR, "package.json")
    with open(package_json_path, "r") as f:
        data = json.load(f)
    
    dependencies = data.get("dependencies", {})
    assert "@magicbell/react" in dependencies, "@magicbell/react package must be listed in package.json dependencies."
