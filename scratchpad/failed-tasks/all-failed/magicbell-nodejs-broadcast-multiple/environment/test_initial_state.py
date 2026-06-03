import os
import shutil

PROJECT_DIR = "/home/user/project"

def test_node_binary_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."

def test_npm_binary_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."

def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."

def test_sdk_installed():
    sdk_path = os.path.join(PROJECT_DIR, "node_modules", "magicbell-js")
    assert os.path.isdir(sdk_path), f"magicbell-js SDK not found at {sdk_path}. Ensure it is installed."