import shutil
import pytest


def test_go_binary_available():
    assert shutil.which("go") is not None, "Go compiler/binary (go) is not found in PATH."
