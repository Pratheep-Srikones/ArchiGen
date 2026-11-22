import json
import time
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict


class ResponseType(str, Enum):
    START = "agent_start"
    OUTPUT = "agent_output"
    VERDICT = "verdict"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    FINAL = "final"
    ERROR = "error"


class StreamEvent(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    run_id: str | None = None
    type: ResponseType
    agent: str | None = None
    iteration: int = 0
    data: dict | str | list | None = None
    timestamp: float | None = None  # in milliseconds

    def __init__(
        self,
        run_id: str | None = None,
        type: ResponseType | str = ResponseType.START,
        agent: str | None = None,
        iteration: int = 0,
        data: dict | str | list | None = None,
        timestamp: float | None = None,
        **kwargs: Any,
    ):
        if isinstance(type, str):
            type = ResponseType(type)
        if timestamp is None:
            timestamp = round(time.time() * 1000, 2)
        super().__init__(
            run_id=run_id,
            type=type,
            agent=agent,
            iteration=iteration,
            data=data,
            timestamp=timestamp,
            **kwargs,
        )

    def to_dict(self) -> dict:
        event_type = (
            self.type.value if isinstance(self.type, ResponseType) else str(self.type)
        )
        return {
            "run_id": self.run_id,
            "type": event_type,
            "agent": self.agent,
            "iteration": self.iteration,
            "data": self.data,
            "timestamp": self.timestamp,
            "ms": self.timestamp,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict())

    def to_sse(self) -> str:
        return f"data: {self.to_json()}\n\n"