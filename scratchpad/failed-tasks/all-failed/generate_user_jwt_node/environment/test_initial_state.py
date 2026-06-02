import json
import os
import shutil
import subprocess

PROJECT_DIR = "/home/user/myproject"


def test_node_binary_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_binary_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_package_json_exists():
    package_json = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(package_json), f"package.json not found at {package_json}."


def test_jsonwebtoken_dependency_installed():
    pkg_dir = os.path.join(PROJECT_DIR, "node_modules", "jsonwebtoken")
    assert os.path.isdir(pkg_dir), (
        "jsonwebtoken package is not pre-installed in /home/user/myproject/node_modules."
    )


def test_jsonwebtoken_loadable():
    result = subprocess.run(
        ["node", "-e", "require('jsonwebtoken'); console.log('ok')"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, (
        f"Failed to require('jsonwebtoken') from {PROJECT_DIR}: {result.stderr}"
    )
    assert "ok" in result.stdout, (
        f"Unexpected output when loading jsonwebtoken: {result.stdout!r}"
    )


def test_required_env_vars_present():
    for var in (
        "MAGICBELL_EMAIL",
        "MAGICBELL_PROJECT_TOKEN",
        "MAGICBELL_API_KEY",
        "MAGICBELL_SECRET_KEY",
        "ZEALT_RUN_ID",
    ):
        assert os.environ.get(var), f"Required environment variable {var} is not set."
