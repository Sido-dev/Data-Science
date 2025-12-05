from sqlalchemy.orm import Session
from . import models, schemas

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, email: str):
    # Create user
    db_user = models.User(email=email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Generate roadmap for this user
    generate_roadmap_for_user(db, db_user.id)
    
    return db_user

def generate_roadmap_for_user(db: Session, user_id: int):
    tasks = []
    
    # Month 1: Python + SQL
    m1_topics = [
        "Install Python, VS Code, Jupyter", "Variables, Data Types", "Operators, Type Conversion", "Conditionals", "Loops",
        "Update LinkedIn", "Revision + Practice", "Functions", "Lambda, map, filter", "Lists, Tuples",
        "Dict, Set", "File handling", "Upload to GitHub", "Revision", "NumPy basics",
        "Arrays", "Pandas basics", "Data cleaning", "Merging, grouping", "Upload notebook",
        "EDA practice", "RDBMS, ER diagrams", "SELECT", "GROUP BY", "JOINS",
        "Window functions", "SQL project", "Revision"
    ]
    
    for i, topic in enumerate(m1_topics):
        day_num = i + 1
        is_weekend = (day_num % 7 == 6) or (day_num % 7 == 0)
        tasks.append(models.DayTask(
            day_number=day_num,
            topic=topic,
            month=1,
            is_weekend=is_weekend,
            status="Pending",
            user_id=user_id
        ))

    # Helper to generate generic days
    def generate_month(start_day, end_day, month_num, theme):
        for d in range(start_day, end_day + 1):
            day_in_month = d - start_day + 1
            is_weekend = (d % 7 == 6) or (d % 7 == 0)
            topic = f"{theme} - Day {day_in_month}"
            if is_weekend:
                if d % 7 == 6: topic = "Weekly Project / GitHub"
                if d % 7 == 0: topic = "Revision / Quiz"
            
            tasks.append(models.DayTask(
                day_number=d,
                topic=topic,
                month=month_num,
                is_weekend=is_weekend,
                status="Pending",
                user_id=user_id
            ))

    generate_month(29, 56, 2, "Statistics + Power BI")
    generate_month(57, 84, 3, "Machine Learning")
    generate_month(85, 112, 4, "Deep Learning + NLP")
    generate_month(113, 140, 5, "GenAI + Streamlit + APIs")
    generate_month(141, 168, 6, "RAG + Capstone + Interview")

    db.add_all(tasks)
    db.commit()

def get_tasks(db: Session, user_id: int, skip: int = 0, limit: int = 168):
    return db.query(models.DayTask).filter(models.DayTask.user_id == user_id).order_by(models.DayTask.day_number).offset(skip).limit(limit).all()

def get_task(db: Session, day_id: int):
    return db.query(models.DayTask).filter(models.DayTask.id == day_id).first()

def update_task(db: Session, day_id: int, task_update: schemas.DayTaskCreate):
    from datetime import datetime
    
    db_task = db.query(models.DayTask).filter(models.DayTask.id == day_id).first()
    if db_task:
        # Track previous status
        previous_status = db_task.status
        
        # Update fields
        db_task.status = task_update.status
        db_task.notes = task_update.notes
        db_task.code_snippet = task_update.code_snippet
        
        # Set completed_at timestamp when status changes to Completed
        if task_update.status == "Completed" and previous_status != "Completed":
            db_task.completed_at = datetime.utcnow()
        # Clear completed_at if status changes from Completed to something else
        elif task_update.status != "Completed" and previous_status == "Completed":
            db_task.completed_at = None
            
        db.commit()
        db.refresh(db_task)
    return db_task

def create_task(db: Session, task: schemas.DayTaskCreate):
    db_task = models.DayTask(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_stats(db: Session, user_id: int):
    total = db.query(models.DayTask).filter(models.DayTask.user_id == user_id).count()
    completed = db.query(models.DayTask).filter(models.DayTask.user_id == user_id, models.DayTask.status == "Completed").count()
    pending = db.query(models.DayTask).filter(models.DayTask.user_id == user_id, models.DayTask.status == "Pending").count()
    in_progress = db.query(models.DayTask).filter(models.DayTask.user_id == user_id, models.DayTask.status == "In Progress").count()
    
    # Simple streak calculation (consecutive completed days ending today or yesterday)
    # This is a simplified version. Real streak logic would need dates.
    # We will just count total completed for now as a proxy or 0.
    streak = 0 
    
    return {
        "total_days": total,
        "completed_days": completed,
        "pending_days": pending,
        "in_progress_days": in_progress,
        "streak": streak,
        "completion_percentage": (completed / total * 100) if total > 0 else 0
    }
