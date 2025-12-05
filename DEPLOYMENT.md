# 🚀 Deployment Guide

## Current Issues Fixed

✅ Removed broken `vite.svg` favicon reference  
✅ Added `render.yaml` for backend deployment  
✅ CORS already configured for Vercel

## Step-by-Step Deployment

### 1️⃣ Deploy Backend to Render

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin master
   ```

2. **Go to [Render.com](https://render.com)** and sign up/login

3. **Create a New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `Sido-dev/Data-Science`
   - Configure the service:
     - **Name**: `ds-genai-backend`
     - **Runtime**: `Python 3`
     - **Build Command**: `pip install -r backend/requirements.txt`
     - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port 10000`
     - **Plan**: Free

4. **Add Environment Variables** (optional):
   - `PYTHON_VERSION` = `3.11.0`

5. **Deploy!** - Copy the deployed URL (e.g., `https://ds-genai-backend.onrender.com`)

### 2️⃣ Configure Vercel Frontend

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Find your project** (`data-science-pied`)

3. **Go to Settings → Environment Variables**

4. **Add New Variable:**
   - **Name**: `VITE_API_URL`
   - **Value**: `https://ds-genai-backend.onrender.com` (your Render backend URL)
   - **Environment**: Production, Preview, Development

5. **Redeploy:**
   - Go to "Deployments" tab
   - Click the three dots on the latest deployment
   - Click "Redeploy"

### 3️⃣ Verify Deployment

1. Visit your frontend: https://data-science-pied.vercel.app/
2. Enter your email to login
3. Check that the dashboard loads with data

## 📝 Important Notes

- **Render Free Tier**: The backend will sleep after 15 minutes of inactivity. First request may take 30-60 seconds to wake up.
- **Database**: Currently using SQLite. For production, consider PostgreSQL on Render.
- **Environment Variables**: Make sure `VITE_API_URL` is set correctly in Vercel.

## 🔧 Troubleshooting

### Frontend shows "Login failed"
- Check if backend is running: Visit `https://your-backend.onrender.com/`
- Verify `VITE_API_URL` is set in Vercel
- Check browser console for CORS errors

### Backend not responding
- Render free tier sleeps after inactivity - wait 30-60 seconds
- Check Render logs for errors

### CORS errors
- Backend already configured for `*.vercel.app` domains
- If using custom domain, add it to `main.py` origins list

## 🎯 Quick Commands

```bash
# Commit and push changes
git add .
git commit -m "Fix deployment configuration"
git push origin master

# Check backend locally
cd backend
uvicorn app.main:app --reload

# Check frontend locally
cd frontend
npm run dev
```
