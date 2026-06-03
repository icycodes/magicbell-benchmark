import os
import shutil
import subprocess

PROJECT_DIR = "/home/user/app"

def test_go_binary_available():
    assert shutil.which("go") is not None, "go binary not found in PATH."

def test_project_dir_exists():
    assert os.path.isdir(PROJECT_DIR), f"Project directory {PROJECT_DIR} does not exist."

def test_go_mod_exists():
    go_mod_path = os.path.join(PROJECT_DIR, "go.mod")
    assert os.path.isfile(go_mod_path), f"go.mod file {go_mod_path} does not exist."
    
    with open(go_mod_path) as f:
        content = f.read()
    assert "github.com/magicbell/magicbell-go" in content, "go.mod does not require github.com/magicbell/magicbell-go"

def test_main_go_exists():
    main_go_path = os.path.join(PROJECT_DIR, "main.go")
    assert os.path.isfile(main_go_path), f"main.go file {main_go_path} does not exist."
