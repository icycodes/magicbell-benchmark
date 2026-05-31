import os
import shutil

def test_go_binary_available():
    assert shutil.which("go") is not None, "Go compiler binary 'go' not found in PATH."

def test_home_dir_exists():
    assert os.path.isdir("/home/user"), "Home directory /home/user does not exist."
