"""Pydantic models for user authentication."""

from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None
    verification_code: str  # 6-digit code from email


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    access_token: str
    refresh_token: str
    new_password: str


class ResetPasswordWithCodeRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


class SendCodeRequest(BaseModel):
    email: EmailStr
    captcha_token: str  # Slider captcha verification token
    code_type: str = "register"  # 'register' or 'reset_password'


class UserInfo(BaseModel):
    id: str
    email: str
    name: str | None = None
    avatar_url: str | None = None
    role: str = "user"
