import json
import os
import shutil
import subprocess

PROJECT_DIR = "/home/user/myproject"


def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."


def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."


def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."


def test_package_json_exists():
    pkg_path = os.path.join(PROJECT_DIR, "package.json")
    assert os.path.isfile(pkg_path), f"Expected pre-seeded package.json at {pkg_path}."


def test_magicbell_js_installed():
    result = subprocess.run(
        ["node", "-e", "require.resolve('magicbell-js/project-client'); require.resolve('magicbell-js/user-client');"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, (
        f"magicbell-js (project-client and user-client) must be importable from {PROJECT_DIR}.\n"
        f"stdout: {result.stdout}\nstderr: {result.stderr}"
    )


def test_jsonwebtoken_installed():
    result = subprocess.run(
        ["node", "-e", "require.resolve('jsonwebtoken')"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, (
        f"jsonwebtoken must be importable from {PROJECT_DIR}.\n"
        f"stdout: {result.stdout}\nstderr: {result.stderr}"
    )


def test_required_env_vars_present():
    for var in ("MAGICBELL_EMAIL", "MAGICBELL_PROJECT_TOKEN", "MAGICBELL_API_KEY", "MAGICBELL_SECRET_KEY", "ZEALT_RUN_ID"):
        assert os.environ.get(var), f"Required environment variable {var} is not set."
