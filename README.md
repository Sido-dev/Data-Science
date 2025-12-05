# DS-GenAI DayWise Learning Tracker

A full-stack application to manage a 6-month Data Science and GenAI learning roadmap. Track progress, manage daily tasks, and visualize your learning journey.

## 🚀 Features

- **Day-wise Roadmap**: 168 days of structured learning.
- **Progress Tracking**: Mark days as Pending, In Progress, or Completed.
- **Dashboard**: Visual stats, weekly progress graph, and streak counter.
- **Notes & Code**: Built-in Monaco Editor for code snippets and notes for each day.
- **Weekly Reminders**: Automatic prompts for revision and portfolio updates.
- **Dark Mode**: Sleek UI with dark mode support.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Recharts, Zustand, Lucide React.
- **Backend**: FastAPI, SQLAlchemy, SQLite.
- **Database**: SQLite (local) / PostgreSQL (production).

## 📂 Folder Structure

```
ds-genai-tracker/
├── backend/                # FastAPI Backend
│   ├── app/
│   │   ├── routers/        # API Endpoints
│   │   ├── models.py       # Database Models
│   │   ├── schemas.py      # Pydantic Schemas
│   │   ├── crud.py         # Database Operations
│   │   └── main.py         # App Entry Point
│   └── requirements.txt
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── store/          # State Management
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## 🏃‍♂️ How to Run Locally

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```
The API will start at `http://127.0.0.1:8000`.
*Note: On first run, it will automatically seed the database with the 168-day roadmap.*

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
The app will start at `http://localhost:5173`.

## 🌐 Deployment Guide

### Backend (Render)

1. Push this repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Connect your GitHub repo.
4. Settings:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port 10000`
5. Add Environment Variable: `PYTHON_VERSION` = `3.9.0` (or similar).

### Frontend (GitHub Pages / Vercel)

**Option A: Vercel (Recommended)**
1. Go to [Vercel](https://vercel.com) and import your repo.
2. Set **Root Directory** to `frontend`.
3. Deploy.
4. Add Environment Variable in Vercel:
   - `VITE_API_URL`: Your Render Backend URL (e.g., `https://your-app.onrender.com`)
   - *Note: You'll need to update `vite.config.js` or `axios` base URL to use this env var in production.*

**Option B: GitHub Pages**
1. Update `vite.config.js` base path if needed.
2. Run `npm run build`.
3. Deploy the `dist` folder using `gh-pages`.

## 📝 Roadmap Overview

- **Month 1**: Python + SQL
- **Month 2**: Statistics + Power BI
- **Month 3**: Machine Learning
- **Month 4**: Deep Learning + NLP
- **Month 5**: GenAI + Streamlit + APIs
- **Month 6**: RAG + Capstone + Interview Prep

---
