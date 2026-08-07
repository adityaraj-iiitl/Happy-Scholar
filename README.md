# 🎓 HappyScholar — AI-Powered Gamified Study Partner

HappyScholar is a premium, full-stack web application designed to optimize student workflows. By combining modern academic organization with powerful Gemini AI tools and habit tracking, HappyScholar helps students study smarter, remain consistent, and prevent cognitive burnout.

---

## 🚀 Key Features

*   **📷 AI Homework Solver**: Take a photo or upload an image of any homework, equation, or question, and get detailed, step-by-step visual solutions powered by Gemini Multimodal AI.
*   **📝 AI Study Notes Generator**: Convert custom topics or uploaded documents (PDFs, text) into comprehensive, formatted Markdown notes with instant summaries.
*   **🃏 Leitner Spaced Repetition Deck**: Add generated notes or study topics to your spaced repetition revision deck, progressing through 5 boxes to lock information in long-term memory.
*   **🎯 Gamified Dashboard & Habit Tracker**: Earn XP, coins, and levels for studying, maintaining streaks, and logging habits. Unlock custom achievement badges as you progress.
*   **📅 Adaptive Study Planner**: Schedule exam deadlines and let the AI distribute milestones evenly. Missed a task? Trigger the adaptive replanner to recalculate your schedule starting from today.
*   **📊 Wellness & Burnout Analytics**: Track sleep, water intake, exercise minutes, screen time, and stress. The AI wellness assistant calculates burnout risk and provides custom lifestyle adjustments.
*   **🛍 AI Product Recommendations**: Get personalized productivity, wellness, and fitness product suggestions based on your logged lifestyle habits.
*   **🔒 Firebase Google Authentication**: Secure, seamless sign-in with Google Sign-In or standard email-password credentials.

---

## 🛠 Tech Stack

### Frontend
*   **Framework**: React (Vite-powered, client-side SPA routing)
*   **Styling**: Tailwind CSS (Premium glassmorphic dashboard styling, responsive dark mode layout)
*   **Icons**: Lucide React
*   **Auth Client**: Firebase Auth Web SDK

### Backend
*   **Framework**: Flask (Python)
*   **Database**: SQLite (SQLAlchemy ORM integration)
*   **AI Integration**: Google Gemini Developer API (AI Notes, Vision Multi-modal Solver, Wellness Analysis, Adaptive Planning)
*   **Auth Verifier**: Firebase Admin Python SDK (with JWT signature-bypassing fallback for local development)

---

## ⚙️ Local Setup Guide

### Prerequisites
*   Node.js (v18+)
*   Python (v3.9+)
*   Firebase Project Credentials

### 1. Configure Environment Variables

Create a `.env` file in the **root** folder:
```env
# Google Gemini API key
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Backend Setup
Navigate to the `backend/` directory:
```bash
cd backend
```

Create a virtual environment and activate it:
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run the backend server:
```bash
python app.py
```
The server will start on [http://127.0.0.1:5000/](http://127.0.0.1:5000/).

### 3. Frontend Setup
Open a new terminal in the **root** directory:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
The client app will launch at [http://localhost:5173/](http://localhost:5173/).

---

## 🚀 Production Deployment (Render)

HappyScholar is configured to be easily deployed as two separate services on [Render](https://render.com/):

### 1. Flask Backend (Web Service)
*   **Root Directory**: `backend`
*   **Runtime**: `Python`
*   **Build Command**: `pip install -r requirements.txt`
*   **Start Command**: `gunicorn app:app`
*   **Env Variables**:
    *   `VITE_GEMINI_API_KEY`: Your live Google Gemini API Key
    *   `FLASK_ENV`: `production`

### 2. React Frontend (Static Site)
*   **Root Directory**: Leave blank (Root)
*   **Build Command**: `npm run build`
*   **Publish Directory**: `dist`
*   **Env Variables**:
    *   `VITE_API_URL`: Your live backend service URL (e.g. `https://happyscholar-backend.onrender.com/api`)
