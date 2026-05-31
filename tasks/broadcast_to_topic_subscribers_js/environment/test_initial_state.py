import os
import shutil
import pytest

def test_node_available():
    """Verify that Node.js is installed and available in the PATH."""
    assert shutil.which("node") is not None, "node binary not found in PATH."

def test_npm_available():
    """Verify that npm is installed and available in the PATH."""
    assert shutil.which("npm") is not None, "npm binary not found in PATH."

def test_home_dir_exists():
    """Verify that the home directory exists."""
    assert os.path.exists("/home/user"), "/home/user directory does not exist."
