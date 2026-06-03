import os
import shutil
import pytest

PROJECT_DIR = "/home/user/magicbell-nodejs-list-inbox-tokens"

def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."

def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."

def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."

def test_package_json_exists():
    package_json_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(package_json_path), f"package.json not found at {package_json_path}."

def test_node_modules_exists():
    node_modules_path = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(node_modules_path), f"node_modules not found at {node_modules_path}."
