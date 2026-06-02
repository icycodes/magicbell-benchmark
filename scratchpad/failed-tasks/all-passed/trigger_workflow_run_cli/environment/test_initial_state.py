import os
import shutil

PROJECT_DIR = "/home/user/magicbell-task"


def test_magicbell_binary_available():
    assert shutil.which("magicbell") is not None, "magicbell binary not found in PATH."


def test_jq_binary_available():
    assert shutil.which("jq") is not None, "jq binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_required_env_vars():
    for var in (
        "MAGICBELL_EMAIL",
        "MAGICBELL_PROJECT_TOKEN",
        "MAGICBELL_API_KEY",
        "MAGICBELL_SECRET_KEY",
        "ZEALT_RUN_ID",
    ):
        assert var in os.environ and os.environ[var].strip() != "", (
            f"{var} environment variable must be set and non-empty before the task starts."
        )

    assert "@" in os.environ["MAGICBELL_EMAIL"], (
        "MAGICBELL_EMAIL must be a valid email address containing '@'."
    )
