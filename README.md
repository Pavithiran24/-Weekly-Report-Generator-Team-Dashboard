# 📊 Weekly Report Generator & Team Dashboard

A production-quality full-stack application for managing weekly team reports with role-based dashboards and rich analytics.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + Tailwind CSS v3 |
| **UI Components** | Lucide React + Recharts |
| **Routing** | React Router v6 |
| **HTTP Client** | Axios |
| **Backend** | FastAPI + Uvicorn |
| **ORM** | SQLAlchemy 2.0 |
| **Database** | MySQL |
| **Auth** | JWT (python-jose) + bcrypt (passlib) |
| **Validation** | Pydantic v2 |

---

## 📁 Project Structure

```
Task/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Settings via pydantic-settings
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── dependencies.py      # JWT auth dependencies
│   │   ├── models/              # SQLAlchemy ORM models
│   │   │   ├── role.py
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   └── report.py
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   └── report.py
│   │   ├── services/            # Business logic layer
│   │   │   ├── auth_service.py
│   │   │   ├── user_service.py
│   │   │   ├── project_service.py
│   │   │   └── report_service.py
│   │   ├── routers/             # FastAPI route handlers
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── projects.py
│   │   │   └── reports.py
│   │   └── middleware/
│   │       └── role_middleware.py
│   ├── requirements.txt
│   └── .env                     # ⚠️ Configure your DB credentials here
│
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios API layer
│   │   ├── components/          # Reusable UI + chart components
│   │   ├── context/             # Auth context
│   │   ├── pages/               # Route pages
│   │   │   ├── auth/            # Login + Register
│   │   │   ├── member/          # Dashboard, Create/Edit/History
│   │   │   └── manager/         # Dashboard, All Reports, Projects
│   │   └── App.jsx
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_by INT REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT REFERENCES users(id),
    project_id INT REFERENCES projects(id),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    tasks_completed TEXT,       -- JSON array stored as string
    tasks_planned TEXT,
    blockers TEXT,
    hours_worked FLOAT,
    status VARCHAR(20) DEFAULT 'draft',  -- draft | submitted | reviewed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8.0+

---

### 1. Database Setup

```sql
CREATE DATABASE weekly_reports CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> The tables are auto-created on first backend startup via SQLAlchemy.
> The `member` and `manager` roles are also seeded automatically.

---

### 2. Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Edit .env and fill in your MySQL credentials:
# DATABASE_URL=mysql+pymysql://YOUR_USER:YOUR_PASSWORD@localhost:3306/weekly_reports
# SECRET_KEY=your-very-secret-key-at-least-32-characters-long

# Start the server
uvicorn app.main:app --reload --port 8000
```

The backend API will be available at: **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/docs**

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at: **http://localhost:5173**

> The Vite dev server proxies `/api` requests to `http://localhost:8000` automatically.

---

## 🔐 Authentication

- JWT access tokens (30-minute expiry)
- Tokens stored in `localStorage`
- Auto-redirect to `/login` on 401 responses
- Role-based route protection in both frontend and backend

### Default Roles (auto-seeded)
| Role | Access |
|------|--------|
| `member` | Own dashboard, create/edit/submit reports |
| `manager` | All reports, analytics, project CRUD, user list |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/me` | Get current user |

### Users (Manager only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/{id}` | Get user by ID |

### Projects
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/projects` | List all projects | Any |
| POST | `/api/projects` | Create project | Manager |
| PUT | `/api/projects/{id}` | Update project | Manager |
| DELETE | `/api/projects/{id}` | Archive project | Manager |

### Reports
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/reports` | Get reports (filtered) | Any |
| GET | `/api/reports/analytics` | Analytics data | Manager |
| GET | `/api/reports/{id}` | Get single report | Any |
| POST | `/api/reports` | Create report | Member |
| PUT | `/api/reports/{id}` | Update draft | Member |
| PATCH | `/api/reports/{id}/submit` | Submit report | Member |

#### Filter Parameters (GET /api/reports)
- `week_start` — filter by week start date (YYYY-MM-DD)
- `project_id` — filter by project
- `user_id` — filter by user (manager only)
- `status` — `draft` | `submitted` | `reviewed`

---

## ✨ Features

### Team Member
- 🔐 Register / Login
- 📊 Personal dashboard with stats (total reports, submitted, drafts, hours)
- ✏️ Create weekly report with:
  - Project selection
  - Week date range
  - Tasks completed (dynamic list)
  - Tasks planned next week
  - Blockers / impediments
  - Hours worked
- 💾 Save as draft or submit directly
- ✏️ Edit draft reports
- 📜 View full report history with status badges

### Manager
- 📈 Analytics dashboard with 4 charts:
  - **Tasks Completed Trend** — Line chart (last 8 weeks)
  - **Submission Status** — Donut pie chart
  - **Project Workload** — Bar chart (hours per project)
  - **Recent Activity** — Timeline feed
- 📋 View all team reports with multi-filter support
- 🗂️ Full CRUD for projects

---

## 🎨 UI Design

- **Dark glassmorphism** theme with backdrop blur
- **Vibrant gradient** accents (blue → purple)
- **Smooth animations** (fade-in, slide-in, hover scale)
- **Responsive** layout with collapsible sidebar
- **Custom scrollbar** styling
- Google Fonts: **Inter**

---

## 🔧 Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/weekly_reports
SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

> ⚠️ **Important**: Change `SECRET_KEY` to a strong random string before production use.
> Generate one with: `python -c "import secrets; print(secrets.token_hex(32))"`

---

## 🧪 Quick Test Flow

1. **Start backend**: `uvicorn app.main:app --reload` (from `backend/`)
2. **Start frontend**: `npm run dev` (from `frontend/`)
3. Go to `http://localhost:5173/register`
4. Register as **Manager** → create some projects
5. Register as **Member** → create and submit reports
6. Switch back to Manager → view analytics and all reports

---

## 📦 Dependencies

### Backend
```
fastapi, uvicorn, sqlalchemy, pymysql, python-dotenv,
python-jose[cryptography], passlib[bcrypt], python-multipart,
pydantic[email], alembic
```

### Frontend
```
react, react-dom, react-router-dom, axios, recharts,
react-hot-toast, lucide-react, date-fns,
tailwindcss, postcss, autoprefixer
```

---

## ✅ Recent Updates

- Added dark/light theme support with a default dark theme.
- Added export actions for PDF and CSV on report pages.
- Added a welcome popup and responsive mobile navigation improvements.
