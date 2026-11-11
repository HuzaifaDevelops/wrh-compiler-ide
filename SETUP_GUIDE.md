# 🚀 WRH Full-Stack Compiler & IDE — Teammate Setup Guide

Welcome to the **WRH Compiler Construction** project! This guide walks you through setting up both the **Django Backend** (Compiler Engine & APIs) and the **Next.js Frontend** (Monaco IDE & Visualizer) on your local machine.

---

## 📋 Prerequisites

Before starting, ensure your PC has:
1. **Python 3.10+** (Verify via `python --version` or `python3 --version`).
2. **Node.js 18+ & npm** (Verify via `node -v` and `npm -v`).
3. **Git** (Verify via `git --version`).

---

## ⚡ Option A: Automated 1-Click Setup (Recommended)

The project includes automated setup scripts that configure the Python virtual environment, install dependencies, migrate the database, and install npm packages.

### On Windows (PowerShell)
Open PowerShell inside the project root directory (`wrh_compiler_app`) and run:
```powershell
.\scripts\setup.ps1
```
*(If PowerShell blocks the script with an execution policy error, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

### On macOS / Linux (Terminal)
Open terminal in the project root directory and run:
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

Once setup finishes, launch the entire application with one command:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser!

---

## 🛠️ Option B: Step-by-Step Manual Setup

If you prefer setting it up step-by-step or run into permissions issues, follow these instructions:

### Step 1: Backend Setup (Django & Compiler Engine)

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python Virtual Environment:
   - **Windows:**
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create the local database and run migrations:
   *(The project has a zero-config SQLite database built-in, so no PostgreSQL installation is required!)*
   ```bash
   python manage.py migrate
   ```

5. (Optional) Run the automated test suite to ensure the compiler engine is 100% operational:
   ```bash
   python manage.py test apps.authentication apps.compiler apps.workspace apps.ai_assistant
   ```

6. Start the Django Backend Server:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```
   > Keep this terminal open. The backend API is now running on `http://127.0.0.1:8000`.

---

### Step 2: Frontend Setup (Next.js 14 & Monaco Editor)

1. Open a **second terminal** and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Ensure `frontend/.env.local` exists (or create it with):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   > Keep this terminal open. The frontend is now running on **`http://localhost:3000`**.

---

## 🤖 Step 3: Setting Up the AI Assistant (Gemini)

The IDE includes an integrated **Gemini AI Assistant** that can generate code and auto-fix compiler errors.

1. Get a free API key at [Google AI Studio](https://aistudio.google.com/).
2. Open the app in your browser at `http://localhost:3000`.
3. Click the **"AI Assistant ✨"** button in the top navbar.
4. Go to the **Settings** tab (gear icon), paste your key, and click **"Save Settings"**.
   *(It is securely stored in your browser's `localStorage` and never committed to Git).*
5. Alternatively, add it to `backend/.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```

---

## ✅ How to Verify It Works

1. Open **`http://localhost:3000`** in your browser.
2. Select any starter snippet from the dropdown (e.g. *Arithmetic & Division* or *Control Flow*).
3. Click **"Compile"** (or press `Ctrl + Enter` / `Cmd + Enter`).
4. You should see:
   - Green **Success** badge with execution latency.
   - **1. Lexer**: Token stream table with line/column coordinates.
   - **2. Parser**: Interactive ASCII Abstract Syntax Tree (AST).
   - **3. Semantic**: Validated symbols and scoped types.
   - **4. ICG**: Three-Address Code (TAC), Quadruples, and Triples tables.
   - **5. Output**: Terminal console displaying `flex(...)` printed results.
5. Click **"AI Assistant ✨"** to test code generation or error auto-repair.

---

## ❓ Common Troubleshooting & FAQs

#### 1. PowerShell script execution error (`Scripts are disabled on this system`)
**Fix:** Run PowerShell as Administrator or execute in your current session:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

#### 2. Port 8000 or 3000 is already in use
**Fix:** Stop whatever process is occupying the port, or run Django on a different port:
```bash
python manage.py runserver 127.0.0.1:8001
```
*(If you change the backend port, update `NEXT_PUBLIC_API_URL=http://localhost:8001` in `frontend/.env.local`).*

#### 3. `ModuleNotFoundError: No module named 'django'`
**Fix:** You forgot to activate the virtual environment! Run:
- Windows: `.\venv\Scripts\activate`
- macOS/Linux: `source venv/bin/activate`

#### 4. Can I work offline without an internet connection?
**Yes!** The entire 5-stage compiler (Lexer, Parser, Semantic Analyzer, ICG, and Interpreter runtime) runs 100% locally on your machine with zero external dependencies. Only the optional Gemini AI feature requires an internet connection.
