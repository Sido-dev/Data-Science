from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import json
from .. import models, schemas
from ..database import get_db

router = APIRouter(tags=["Activity"])

@router.post("/activity", response_model=schemas.UserActivity)
def log_activity(
    activity: schemas.UserActivityCreate,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Log user activity"""
    db_activity = models.UserActivity(
        user_id=user_id,
        activity_type=activity.activity_type,
        session_id=activity.session_id,
        meta_info=activity.meta_info
    )
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

@router.get("/activity/{user_id}", response_model=List[schemas.UserActivity])
def get_user_activities(
    user_id: int,
    limit: int = 50,
    activity_type: str = None,
    db: Session = Depends(get_db)
):
    """Get user activity history"""
    query = db.query(models.UserActivity).filter(
        models.UserActivity.user_id == user_id
    )
    
    if activity_type:
        query = query.filter(models.UserActivity.activity_type == activity_type)
    
    activities = query.order_by(
        models.UserActivity.timestamp.desc()
    ).limit(limit).all()
    
    return activities

@router.get("/activity/{user_id}/stats")
def get_activity_stats(user_id: int, db: Session = Depends(get_db)):
    """Get user activity statistics"""
    # Total activities
    total_activities = db.query(models.UserActivity).filter(
        models.UserActivity.user_id == user_id
    ).count()
    
    # Login count
    login_count = db.query(models.UserActivity).filter(
        models.UserActivity.user_id == user_id,
        models.UserActivity.activity_type == "login"
    ).count()
    
    # Last login
    last_login = db.query(models.UserActivity).filter(
        models.UserActivity.user_id == user_id,
        models.UserActivity.activity_type == "login"
    ).order_by(models.UserActivity.timestamp.desc()).first()
    
    # Activities in last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_activities = db.query(models.UserActivity).filter(
        models.UserActivity.user_id == user_id,
        models.UserActivity.timestamp >= seven_days_ago
    ).count()
    
    return {
        "total_activities": total_activities,
        "login_count": login_count,
        "last_login": last_login.timestamp if last_login else None,
        "recent_activities_7d": recent_activities
    }

@router.get("/activity/{user_id}/sessions")
def get_active_sessions(user_id: int, db: Session = Depends(get_db)):
    """Get active user sessions (last 24 hours)"""
    yesterday = datetime.utcnow() - timedelta(hours=24)
    
    sessions = db.query(models.UserActivity.session_id).filter(
        models.UserActivity.user_id == user_id,
        models.UserActivity.timestamp >= yesterday,
        models.UserActivity.session_id.isnot(None)
    ).distinct().all()
    
    return {
        "active_sessions": len(sessions),
        "session_ids": [s[0] for s in sessions]
    }
