import os
import shutil

PROJECT_DIR = "/home/user/go-task"

def test_go_binary_available():
    assert shutil.which("go") is not None, "go binary not found in PATH."

def test_project_directory_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."
