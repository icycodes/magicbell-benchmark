import os
import shutil

def test_go_installed():
    assert shutil.which("go") is not None, "Go is not installed or not in PATH."

def test_project_dir_exists():
    assert os.path.isdir("/home/user/magicbell-task"), "Project directory /home/user/magicbell-task does not exist."
