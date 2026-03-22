from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Clinical Skills Coach API"
    app_version: str = "0.1.0"
    frontend_origin: str = "http://localhost:3000"
    simulation_only: bool = True
    ai_provider: str = Field(
        default="auto",
        validation_alias=AliasChoices("AI_PROVIDER", "LLM_PROVIDER"),
    )
    ai_api_base_url: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "AI_API_BASE_URL",
            "OPENAI_API_BASE_URL",
            "ANTHROPIC_API_BASE_URL",
        ),
    )
    ai_api_key: str = Field(
        default="EMPTY",
        validation_alias=AliasChoices(
            "AI_API_KEY",
            "OPENAI_API_KEY",
            "ANTHROPIC_API_KEY",
        ),
    )
    ai_analysis_model: str = Field(
        default="chaitnya26/Qwen2.5-Omni-3B-Fork",
        validation_alias=AliasChoices(
            "AI_ANALYSIS_MODEL",
            "OPENAI_ANALYSIS_MODEL",
            "ANTHROPIC_ANALYSIS_MODEL",
        ),
    )
    ai_debrief_model: str = Field(
        default="chaitnya26/Qwen2.5-Omni-3B-Fork",
        validation_alias=AliasChoices(
            "AI_DEBRIEF_MODEL",
            "OPENAI_DEBRIEF_MODEL",
            "ANTHROPIC_DEBRIEF_MODEL",
        ),
    )
    ai_coach_model: str = Field(
        default="chaitnya26/Qwen2.5-Omni-3B-Fork",
        validation_alias=AliasChoices(
            "AI_COACH_MODEL",
            "OPENAI_COACH_MODEL",
            "ANTHROPIC_COACH_MODEL",
        ),
    )
    ai_learning_model: str = Field(
        default="claude-haiku-4-5",
        validation_alias=AliasChoices(
            "AI_LEARNING_MODEL",
            "OPENAI_LEARNING_MODEL",
            "ANTHROPIC_LEARNING_MODEL",
        ),
    )
    ai_timeout_seconds: float = Field(
        default=60.0,
        validation_alias=AliasChoices(
            "AI_TIMEOUT_SECONDS",
            "OPENAI_TIMEOUT_SECONDS",
            "ANTHROPIC_TIMEOUT_SECONDS",
        ),
    )
    ai_analysis_max_tokens: int = Field(
        default=1400,
        validation_alias=AliasChoices(
            "AI_ANALYSIS_MAX_TOKENS",
            "OPENAI_ANALYSIS_MAX_TOKENS",
            "ANTHROPIC_ANALYSIS_MAX_TOKENS",
        ),
    )
    ai_debrief_max_tokens: int = Field(
        default=1200,
        validation_alias=AliasChoices(
            "AI_DEBRIEF_MAX_TOKENS",
            "OPENAI_DEBRIEF_MAX_TOKENS",
            "ANTHROPIC_DEBRIEF_MAX_TOKENS",
        ),
    )
    ai_coach_max_tokens: int = Field(
        default=900,
        validation_alias=AliasChoices(
            "AI_COACH_MAX_TOKENS",
            "OPENAI_COACH_MAX_TOKENS",
            "ANTHROPIC_COACH_MAX_TOKENS",
        ),
    )
    ai_safety_max_tokens: int = Field(
        default=600,
        validation_alias=AliasChoices(
            "AI_SAFETY_MAX_TOKENS",
            "OPENAI_SAFETY_MAX_TOKENS",
            "ANTHROPIC_SAFETY_MAX_TOKENS",
        ),
    )
    ai_learning_max_tokens: int = Field(
        default=1800,
        validation_alias=AliasChoices(
            "AI_LEARNING_MAX_TOKENS",
            "OPENAI_LEARNING_MAX_TOKENS",
            "ANTHROPIC_LEARNING_MAX_TOKENS",
        ),
    )
    human_review_confidence_threshold: float = Field(
        default=0.78,
        validation_alias=AliasChoices("HUMAN_REVIEW_CONFIDENCE_THRESHOLD"),
    )
    grading_confidence_threshold: float = Field(
        default=0.8,
        validation_alias=AliasChoices("GRADING_CONFIDENCE_THRESHOLD"),
    )
    anthropic_version: str = Field(
        default="2023-06-01",
        validation_alias=AliasChoices("ANTHROPIC_VERSION"),
    )
    transcription_api_base_url: str = Field(
        default="https://api.openai.com/v1",
        validation_alias=AliasChoices(
            "TRANSCRIPTION_API_BASE_URL",
            "OPENAI_TRANSCRIPTION_API_BASE_URL",
            "OPENAI_API_BASE_URL",
        ),
    )
    transcription_api_key: str = Field(
        default="EMPTY",
        validation_alias=AliasChoices(
            "TRANSCRIPTION_API_KEY",
            "OPENAI_TRANSCRIPTION_API_KEY",
            "OPENAI_API_KEY",
        ),
    )
    transcription_model: str = Field(
        default="gpt-4o-mini-transcribe",
        validation_alias=AliasChoices(
            "TRANSCRIPTION_MODEL",
            "OPENAI_TRANSCRIPTION_MODEL",
        ),
    )
    transcription_timeout_seconds: float = Field(
        default=60.0,
        validation_alias=AliasChoices(
            "TRANSCRIPTION_TIMEOUT_SECONDS",
            "OPENAI_TRANSCRIPTION_TIMEOUT_SECONDS",
        ),
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
