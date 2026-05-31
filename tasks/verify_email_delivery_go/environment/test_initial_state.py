import os
import shutil
import pytest

def test_go_binary_available():
    assert shutil.which("go") is not None, "Go binary not found in PATH."

def test_magicbell_env_vars():
    assert os.getenv("MAGICBELL_PROJECT_TOKEN"), "MAGICBELL_PROJECT_TOKEN environment variable is not set."
    assert os.getenv("GMAIL_USER_NAME"), "GMAIL_USER_NAME environment variable is not set."
    assert os.getenv("ZEALT_RUN_ID"), "ZEALT_RUN_ID environment variable is not set."
