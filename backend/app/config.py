from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://bars:bars@localhost:5432/bars_engine"
    openai_api_key: SecretStr = SecretStr("")
    logfire_token: SecretStr = SecretStr("")
    secret_key: SecretStr = SecretStr("change-me-in-production")
    dev_player_id: str = ""
    agent_model: str = "openai:gpt-4o"
    environment: str = "development"
    cors_origins: str = ""
    github_token: SecretStr = SecretStr("")
    github_repo: str = ""

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        """Normalize postgres:// or postgresql:// to postgresql+asyncpg://."""
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @property
    def sync_database_url(self) -> str:
        """Sync URL for tools that require a non-async driver (e.g. psycopg2)."""
        return self.database_url.replace("+asyncpg", "")

    model_config = {
        "env_file": (".env", "../.env.local"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
