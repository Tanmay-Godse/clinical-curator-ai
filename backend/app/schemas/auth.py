from typing import Literal

from pydantic import BaseModel, ConfigDict

AdminApprovalStatus = Literal["none", "pending", "rejected"]


class AuthAccountPreview(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    username: str
    role: Literal["student", "admin"]
    is_developer: bool = False
    requested_role: Literal["admin"] | None = None
    admin_approval_status: AdminApprovalStatus = "none"
    created_at: str


class CreateAuthAccountRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    username: str
    password: str
    role: Literal["student", "admin"]


class SignInAuthRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    identifier: str
    password: str
    role: Literal["student", "admin"] | None = None


class UpdateAuthAccountRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    username: str
    current_password: str
    new_password: str | None = None


class ResolveAdminRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    developer_account_id: str
