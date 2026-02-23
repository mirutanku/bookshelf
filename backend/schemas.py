from pydantic import BaseModel, field_validator
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str

    @field_validator("password")
    @classmethod
    def password_max_length(cls, v):
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password must be 72 bytes or fewer")
        return v

class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    olid: str | None
    cover_url: str | None
    first_publish_year: int | None

    class Config:
        from_attributes = True

class UserBookCreate(BaseModel):
    olid: str
    title: str
    author: str
    cover_url: str | None = None
    first_publish_year: int | None = None
    status: str = "want_to_read"
    rating: int | None = None
    notes: str | None = None

class UserBookUpdate(BaseModel):
    status: str | None = None
    rating: int | None = None
    notes: str | None = None

class UserBookResponse(BaseModel):
    id: int
    status: str
    rating: int | None
    notes: str | None
    created_at: datetime
    book: BookResponse

    class Config:
        from_attributes = True