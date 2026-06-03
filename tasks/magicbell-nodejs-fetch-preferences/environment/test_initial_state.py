import os
import shutil
import subprocess

PROJECT_DIR = "/home/user/magicbell-nodejs-fetch-preferences"

def test_node_available():
    assert shutil.which("node") is not None, "node binary not found in PATH."

def test_npm_available():
    assert shutil.which("npm") is not None, "npm binary not found in PATH."

def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."

def test_packages_installed():
    # Check if node_modules exists
    node_modules_path = os.path.join(PROJECT_DIR, "node_modules")
    assert os.path.isdir(node_modules_path), "node_modules directory does not exist. Packages are not installed."
    
    # Check if magicbell-js is installed
    magicbell_path = os.path.join(node_modules_path, "magicbell-js")
    assert os.path.isdir(magicbell_path), "magicbell-js package is not installed."
    
    # Check if jsonwebtoken is installed
    jwt_path = os.path.join(node_modules_path, "jsonwebtoken")
    assert os.path.isdir(jwt_path), "jsonwebtoken package is not installed."
