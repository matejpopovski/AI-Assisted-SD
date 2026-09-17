from __future__ import annotations

from typing import Annotated

import structlog
from fastapi import Cookie, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from ..common.exceptions import ForbiddenError, UnauthorizedError
from ..database import get_db
from ..models.user import User
from ..services import game_service
from ..services.auth_service import decode_token, get_user_by_id

logger = structlog.get_logger()

_bearer = HTTPBearer(auto_error=False)


async def _token_from_request(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    access_token: Annotated[str | None, Cookie()] = None,
) -> str | None:
    """Extract JWT from Authorization header or access_token cookie."""
    if credentials:
        return credentials.credentials
    return access_token


async def get_current_user(
    token: Annotated[str | None, Depends(_token_from_request)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if not token:
        raise UnauthorizedError("Authentication required")
    try:
        payload = decode_token(token)
    except JWTError:
        raise UnauthorizedError("Invalid or expired token")

    token_type = payload.get("token_type")
    if token_type not in ("access", "temp"):
        raise UnauthorizedError("Invalid token type")

    user = await get_user_by_id(db, payload["sub"])
    if not user:
        raise UnauthorizedError("User not found")
    return user


async def require_admin(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if user.role != "ADMIN":
        raise ForbiddenError("Admin access required")
    return user


async def require_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Allow ADMIN and USER roles; reject GUEST."""
    if user.role == "GUEST":
        raise ForbiddenError("Authenticated account required")
    return user


async def require_course_host(
    course_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Admin, or a host (UserCourseAccess role=HOST) of this specific course.
    Thin wrapper around game_service.assert_host_can_use_course — the same check
    create_room already uses, not a parallel permission system. See
    docs/plans/host-admin-restructuring.md."""
    await game_service.assert_host_can_use_course(db, user, course_id)
    return user


async def require_game_host(
    game_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Admin, or a host of this specific game (via UserGameAccess or HOST access
    to the game's own course). Thin wrapper around
    game_service.assert_host_can_use_game."""
    await game_service.assert_host_can_use_game(db, user, game_id)
    return user


async def get_refresh_token(
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> str:
    if not refresh_token:
        raise UnauthorizedError("No refresh token")
    return refresh_token
