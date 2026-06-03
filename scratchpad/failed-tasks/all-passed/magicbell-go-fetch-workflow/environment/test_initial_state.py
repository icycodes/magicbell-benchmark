import os
import shutil

def test_go_binary_available():
    assert shutil.which("go") is not None, "go binary not found in PATH."

def test_project_directory_exists():
    assert os.path.isdir("/home/user/magicbell-go-fetch-workflow"), "Project directory /home/user/magicbell-go-fetch-workflow does not exist."
