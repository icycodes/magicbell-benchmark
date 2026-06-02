import os
import shutil


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_home_user_dir_exists():
    assert os.path.isdir("/home/user"), "/home/user directory must exist."


def test_magicbell_email_env():
    assert os.environ.get("MAGICBELL_EMAIL"), "MAGICBELL_EMAIL env var must be set."


def test_magicbell_project_token_env():
    assert os.environ.get("MAGICBELL_PROJECT_TOKEN"), "MAGICBELL_PROJECT_TOKEN env var must be set."


def test_magicbell_api_key_env():
    assert os.environ.get("MAGICBELL_API_KEY"), "MAGICBELL_API_KEY env var must be set."


def test_magicbell_secret_key_env():
    assert os.environ.get("MAGICBELL_SECRET_KEY"), "MAGICBELL_SECRET_KEY env var must be set."


def test_zealt_run_id_env():
    assert os.environ.get("ZEALT_RUN_ID"), "ZEALT_RUN_ID env var must be set."
