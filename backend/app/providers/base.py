from dataclasses import dataclass
from typing import Any, Protocol


class AIConfigurationError(RuntimeError):
    pass


class AIRequestError(RuntimeError):
    pass


class AIResponseError(RuntimeError):
    pass


PLACEHOLDER_API_KEYS = frozenset(
    {
        "SET_IN_ENV_MANAGER",
        "SET_IN_MICROMAMBA_ENV",
        "YOUR_REAL_KEY_HERE",
    }
)


def is_placeholder_api_key(api_key: str) -> bool:
    return api_key.strip().upper() in PLACEHOLDER_API_KEYS


@dataclass(frozen=True)
class JSONMessageRequest:
    model: str
    system_prompt: str
    user_content: list[dict[str, Any]]
    output_schema: dict[str, Any]
    max_tokens: int


class JSONMessageProvider(Protocol):
    def send_json_message(self, request: JSONMessageRequest) -> dict[str, Any]:
        ...
