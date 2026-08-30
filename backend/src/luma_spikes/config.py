from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class MissingOpenAICredentialsError(RuntimeError):
    pass


def load_project_environment() -> None:
    """Load local development values without overriding deployed environment."""
    load_dotenv(PROJECT_ROOT / ".env", override=False)

