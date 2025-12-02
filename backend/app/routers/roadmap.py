from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, models, schemas, database

router = APIRouter()

@router.post("/login", response_model=schemas.User)
def login(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if not db_user:
        db_user = crud.create_user(db, email=user.email)
    return db_user

@router.get("/roadmap", response_model=List[schemas.DayTask])
def read_roadmap(user_id: int, skip: int = 0, limit: int = 168, db: Session = Depends(database.get_db)):
    tasks = crud.get_tasks(db, user_id=user_id, skip=skip, limit=limit)
    return tasks

@router.put("/roadmap/{day_id}", response_model=schemas.DayTask)
def update_day(day_id: int, task: schemas.DayTaskCreate, db: Session = Depends(database.get_db)):
    # Note: In a real app, we should verify the user owns this task.
    # For now, we assume the ID is sufficient.
    db_task = crud.update_task(db, day_id=day_id, task_update=task)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Day not found")
    return db_task

@router.get("/stats", response_model=schemas.Stats)
def read_stats(user_id: int, db: Session = Depends(database.get_db)):
    return crud.get_stats(db, user_id=user_id)
