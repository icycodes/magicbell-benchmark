import os
import shutil

def test_go_binary_available():
    assert shutil.which("go") is not None, "Go compiler/binary not found in PATH."

def test_magicbell_env_vars_exist():
    required_vars = ["MAGICBELL_API_KEY", "MAGICBELL_SECRET_KEY", "MAGICBELL_PROJECT_TOKEN", "ZEALT_RUN_ID"]
    for var in required_vars:
        assert var in os.environ, f"Required environment variable {var} is not set."
        assert os.environ[var] != "", f"Required environment variable {var} is empty."
