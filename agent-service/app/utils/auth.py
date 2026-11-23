from fastapi import Header
from app.core.exceptions import UnauthorizedError


def get_current_user_id(x_user_id: str = Header(None)):
    if not x_user_id:
        raise UnauthorizedError()
    return x_user_id
