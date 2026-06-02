import os
import shutil


def test_node_binary_available():
    assert shutil.which("node") is not None, "Node.js binary not found in PATH."


def test_npm_binary_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_required_env_vars():
    assert "MAGICBELL_PROJECT_TOKEN" in os.environ, \
        "MAGICBELL_PROJECT_TOKEN environment variable is missing."
    assert os.environ["MAGICBELL_PROJECT_TOKEN"].strip() != "", \
        "MAGICBELL_PROJECT_TOKEN is empty."

    assert "MAGICBELL_EMAIL" in os.environ, \
        "MAGICBELL_EMAIL environment variable is missing."
    assert os.environ["MAGICBELL_EMAIL"].strip() != "", \
        "MAGICBELL_EMAIL is empty."
    assert "@" in os.environ["MAGICBELL_EMAIL"], \
        "MAGICBELL_EMAIL must be a valid email address containing '@'."

    assert "ZEALT_RUN_ID" in os.environ, \
        "ZEALT_RUN_ID environment variable is missing."
    assert os.environ["ZEALT_RUN_ID"].strip() != "", \
        "ZEALT_RUN_ID is empty."


def test_project_dir_exists():
    project_dir = "/home/user/myproject"
    assert os.path.isdir(project_dir), \
        f"Expected project directory {project_dir} to exist before the task starts."
