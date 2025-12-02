from pydantic import BaseModel
from typing import Optional, List

class DayTaskBase(BaseModel):
    day_number: int
    topic: str
    description: Optional[str] = None
    status: str = "Pending"
    notes: Optional[str] = None
    code_snippet: Optional[str] = None
    month: int
    is_weekend: bool = False

class DayTaskCreate(DayTaskBase):
    pass

class DayTask(DayTaskBase):
    id: int

    class Config:
        orm_mode = True

class Stats(BaseModel):
    total_days: int
    completed_days: int
    pending_days: int
    in_progress_days: int
    streak: int
    completion_percentage: float

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True
