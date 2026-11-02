# WRH Full-Stack Compiler Web Application

A modern, production-grade monorepo web application featuring an interactive web-based IDE, multi-stage compiler execution engine, and inspection dashboard for the **WRH** programming language (developed for the Compiler Construction course).

---

## 🏛 Architecture Overview

```
+----------------------------------------------------------------------------------------------------+
|                                 Next.js Frontend (Port 3000)                                       |
|  +--------------------+  +---------------------------------------------+  +---------------------+  |
|  | Auth Status / User |  | WRH Code Editor (Monaco + Custom Monarch)   |  | Docs Drawer (Rules) |  |
|  +--------------------+  +---------------------------------------------+  +---------------------+  |
|  +----------------------------------------------------------------------------------------------+  |
|  | Multi-Stage Engine Inspector (Stage 1: Tokens | Stage 2: AST | Stage 3: Symbols | All Stages) |  |
|  +----------------------------------------------------------------------------------------------+  |
+--------------------------------------------------+-------------------------------------------------+
                                                   | HTTP JSON (REST API /api/compile/, /api/auth/)
                                                   v
+----------------------------------------------------------------------------------------------------+
|                                 Django 5 + DRF Backend (Port 8000)                                 |
|  +---------------------+  +---------------------------------------------------------------------+  |
|  | SimpleJWT Auth App  |  | Multi-Stage WRH Compiler Engine App                                 |  |
|  | User Registration,  |  | - Stage 1: Lexer (Tokens, coordinates, custom operators)             |  |
|  | Login, Token Refresh|  | - Stage 2: Recursive Descent Parser (AST node schema, ASCII tree)   |  |
|  | Snippet CRUD        |  | - Stage 3: Semantic Analyzer (Symbol Table, 6 validation rules)     |  |
|  +---------------------+  +---------------------------------------------------------------------+  |
|  +----------------------------------------------------------------------------------------------+  |
|  | Database: 3-Tier Resilient Configuration (Supabase PostgreSQL -> SQLite fallback)           |  |
|  +----------------------------------------------------------------------------------------------+  |
+----------------------------------------------------------------------------------------------------+
```

- **Frontend**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Monaco Editor with custom WRH Monarch grammar, Lucide icons, and Axios with JWT interceptors.
- **Backend**: Django 5, Django REST Framework, SimpleJWT authentication, resilient 3-tier database configuration (Supabase PostgreSQL with automatic fallback to local SQLite), and modular compiler engine.
- **Testing**: Comprehensive 4-tier automated test suite covering feature coverage, boundary conditions, cross-feature combinations, real-world benchmarks, and API contract validations.

---

## 📁 Repository Structure

```
wrh_compiler_app/
├── package.json                      # Monorepo scripts and dev dependencies
├── README.md                         # Quickstart & architectural documentation
├── .gitignore                        # Monorepo gitignore rules
├── scripts/
│   ├── dev.ps1                       # Windows PowerShell dev server launcher
│   ├── dev.sh                        # POSIX dev server launcher
│   ├── setup.ps1                     # Windows PowerShell automated setup
│   ├── setup.sh                      # POSIX automated setup
│   ├── run-backend.js                # Cross-platform Django backend runner
│   └── run-backend-test.js           # Cross-platform Django test runner
├── backend/
│   ├── manage.py
│   ├── requirements.txt              # Django, DRF, SimpleJWT, psycopg[binary], etc.
│   ├── .env.example                  # Backend environment template
│   ├── wrh_backend/                  # Django project core (settings, URLs, WSGI, ASGI)
│   └── apps/
│       ├── authentication/           # CustomUser, JWT register/login/profile views & tests
│       ├── compiler/                 # Compiler API views (/api/compile/) and tests
│       └── workspace/                # Snippet CRUD views (/api/workspace/snippets/) and tests
├── frontend/
│   ├── package.json                  # Next.js, React, Tailwind, Monaco, Axios
│   ├── tsconfig.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── .eslintrc.json
│   ├── .env.example
│   └── src/
│       ├── app/                      # App router layout and pages
│       ├── components/               # UI components, Editor, Visualizer, Docs
│       ├── context/                  # AuthContext for session management
│       ├── lib/                      # Axios client, Monarch grammar, starter snippets
│       ├── styles/                   # Global CSS styling
│       └── types/                    # TypeScript interfaces for compiler & auth
└── tests/
    └── e2e/                          # 4-tier E2E and API contract test suite
```

---

## 🚀 Quickstart & Setup

### Prerequisites
- **Python**: 3.10+
- **Node.js**: 18+ (LTS) or 20+

### Automated Setup
On Windows (PowerShell):
```powershell
.\scripts\setup.ps1
```

On Linux / macOS:
```bash
chmod +x scripts/setup.sh scripts/dev.sh
./scripts/setup.sh
```

### Manual Setup
1. **Root Dependencies**:
   ```bash
   npm install
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On POSIX:
   source venv/bin/activate

   pip install -r requirements.txt
   python manage.py migrate
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   ```

---

## 💻 Running the Application

### Launch Both Backend & Frontend Concurrently:
```bash
npm run dev
```
Or on Windows:
```powershell
.\scripts\dev.ps1
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Django Admin**: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

### Individual Services:
- Backend only: `npm run dev:backend`
- Frontend only: `npm run dev:frontend`

---

## 🧪 Testing & Verification

### Run All Tests:
```bash
npm test
```

### Run Backend Unit Tests:
```bash
npm run test:backend
# Or directly via manage.py:
cd backend
python manage.py test apps
```

### Run Comprehensive E2E Tests:
```bash
python tests/e2e/run_e2e_tests.py
```

### Frontend Build & Lint:
```bash
cd frontend
npm run lint
npm run build
```

---

## 📡 API Endpoints

### Compiler Engine:
- `POST /api/compile/` - Execute multi-stage compilation on WRH source code. Returns tokens, AST, symbol table, error diagnostics, and stage latency.

### Authentication (`/api/auth/`):
- `POST /api/auth/register/` - Register new user account.
- `POST /api/auth/login/` - Authenticate credentials and obtain JWT token pair.
- `POST /api/auth/token/refresh/` - Refresh expired access token.
- `GET /api/auth/profile/` - Fetch authenticated user profile.

### Workspace Snippets (`/api/workspace/`):
- `GET /api/workspace/snippets/` - List saved snippets for the current user.
- `POST /api/workspace/snippets/` - Save a new code snippet.
- `GET /api/workspace/snippets/{id}/` - Retrieve a specific snippet.
- `PUT /api/workspace/snippets/{id}/` - Update a snippet.
- `DELETE /api/workspace/snippets/{id}/` - Delete a snippet.
