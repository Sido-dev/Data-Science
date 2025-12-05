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
    
    # Relationships
    tasks = relationship("DayTask", back_populates="owner")
    activities = relationship("UserActivity", back_populates="user")

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

class UserActivity(Base):
    __tablename__ = "user_activity"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    # Activity tracking
    activity_type = Column(String, index=True)  # login, logout, task_viewed, task_updated, etc.
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    session_id = Column(String, index=True, nullable=True)
    
    # Additional context (stored as JSON for flexibility)
    meta_info = Column(Text, nullable=True)  # JSON string: {device, browser, ip, etc.}
    
    # Relationship
    user = relationship("User", back_populates="activities")

