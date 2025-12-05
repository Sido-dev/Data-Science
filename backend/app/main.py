from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .routers import roadmap, activity
from . import models

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DS-GenAI Learning Tracker")

# CORS
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex="https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(roadmap.router, prefix="/api")
app.include_router(activity.router, prefix="/api")

# Seed Data removed in favor of user-specific roadmap generation


@app.get("/")
def read_root():
    return {"message": "Welcome to DS-GenAI Tracker API"}
