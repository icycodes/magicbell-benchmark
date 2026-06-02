import os
import shutil

PROJECT_DIR = "/home/user/myproject"


def test_python3_available():
    assert shutil.which("python3") is not None, "python3 binary not found in PATH."


def test_pip_available():
    assert shutil.which("pip") is not None or shutil.which("pip3") is not None, (
        "pip binary not found in PATH."
    )


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), (
        f"Project directory {PROJECT_DIR} does not exist."
    )


def test_pyjwt_importable():
    import jwt  # PyJWT  # noqa: F401


def test_requests_importable():
    import requests  # noqa: F401


def test_magicbell_env_vars_present():
    for var in (
        "MAGICBELL_EMAIL",
        "MAGICBELL_PROJECT_TOKEN",
        "MAGICBELL_API_KEY",
        "MAGICBELL_SECRET_KEY",
    ):
        assert os.environ.get(var), (
            f"Required environment variable {var} is not set in the task environment."
        )
