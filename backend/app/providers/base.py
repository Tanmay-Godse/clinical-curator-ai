from dataclasses import dataclass
from typing import Any, Protocol


class AIConfigurationError(RuntimeError):
    pass


class AIRequestError(RuntimeError):
    pass


class AIResponseError(RuntimeError):
    pass


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

