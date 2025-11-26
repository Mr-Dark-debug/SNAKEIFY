from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Song(BaseModel):
    order: int
    title: str
    artist: str
    cover_url: str
    preview_url: Optional[str] = None
    spotify_uri: Optional[str] = None

class GameSessionBase(BaseModel):
    score: int
    eaten_songs: List[Song]

class GameSessionCreate(GameSessionBase):
    pass

class GameSession(GameSessionBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    spotify_id: str
    display_name: str
    profile_image: Optional[str] = None

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    sessions: List[GameSession] = []

    class Config:
        orm_mode = True
