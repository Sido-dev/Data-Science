from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

class DayTask(Base):
    __tablename__ = "day_tasks"

    id = Column(Integer, primary_key=True, index=True)
    day_number = Column(Integer, index=True)
    topic = Column(String, index=True)
    description = Column(Text, nullable=True)
    status = Column(String, default="Pending") # Pending, In Progress, Completed
    notes = Column(Text, nullable=True)
    code_snippet = Column(Text, nullable=True)
    month = Column(Integer)
    
    # Timestamps
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # For simple reminder logic
    is_weekend = Column(Boolean, default=False)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="tasks")

User.tasks = relationship("DayTask", back_populates="owner")
