from __future__ import annotations

from typing import Sequence

from fastapi import HTTPException, Request, status


class RoleChecker:
    """Callable dependency that raises 403 if the user's role is not allowed."""

    def __init__(self, allowed_roles: Sequence[str]) -> None:
        self.allowed_roles = allowed_roles

    def __call__(self, request: Request) -> None:
        user = getattr(request.state, "current_user", None)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )
        role_name = user.role.name if user.role else ""
        if role_name not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role_name}' is not permitted for this resource",
            )
