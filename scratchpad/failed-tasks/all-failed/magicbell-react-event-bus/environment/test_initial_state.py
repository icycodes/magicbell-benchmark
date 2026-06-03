import os
import shutil
import pytest

def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."

def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."

def test_project_dir_does_not_exist_yet():
    assert not os.path.exists("/home/user/myproject"), "Project directory should not exist yet."