import os
import shutil


def test_node_available():
    assert shutil.which("node") is not None, "Node.js binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    project_dir = "/home/user/myproject"
    assert os.path.isdir(project_dir), f"Project directory {project_dir} does not exist."


def test_required_env_vars():
    for var in (
        "MAGICBELL_EMAIL",
        "MAGICBELL_PROJECT_TOKEN",
        "MAGICBELL_API_KEY",
        "MAGICBELL_SECRET_KEY",
        "ZEALT_RUN_ID",
    ):
        assert var in os.environ, f"{var} environment variable is missing."
        assert os.environ[var].strip() != "", f"{var} is empty."
