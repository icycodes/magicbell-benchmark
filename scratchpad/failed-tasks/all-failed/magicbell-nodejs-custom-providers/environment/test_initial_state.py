import os
import pytest

PROJECT_DIR = "/home/user/magicbell-project"

def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."
