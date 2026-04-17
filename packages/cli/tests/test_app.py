from typer.testing import CliRunner

from studysolo_cli import __version__
from studysolo_cli.app import app


runner = CliRunner()


def test_root_version_option_exits_zero():
    result = runner.invoke(app, ["--version"])

    assert result.exit_code == 0
    assert f"studysolo-cli {__version__}" in result.stdout


def test_root_help_still_lists_commands():
    result = runner.invoke(app, ["--help"])

    assert result.exit_code == 0
    assert "login" in result.stdout
    assert "wf" in result.stdout
