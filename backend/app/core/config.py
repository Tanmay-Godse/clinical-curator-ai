from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Clinical Skills Coach API"
    app_version: str = "0.1.0"
    frontend_origin: str = "http://localhost:3000"
    simulation_only: bool = True
    anthropic_api_key: str | None = None
    anthropic_analysis_model: str = "claude-sonnet-4-6"
    anthropic_debrief_model: str = "claude-haiku-4-5"
    anthropic_timeout_seconds: float = 60.0
    anthropic_analysis_max_tokens: int = 1400
    anthropic_debrief_max_tokens: int = 1200

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
