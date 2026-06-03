import os
import shutil

PROJECT_DIR = "/home/user/magicbell-task"

def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."

def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."

def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."

def test_magicbell_js_installed():
    node_modules_dir = os.path.join(PROJECT_DIR, "node_modules", "magicbell-js")
    assert os.path.isdir(node_modules_dir), "magicbell-js is not installed in the project directory."
