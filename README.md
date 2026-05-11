# BlogVerse — AI-Powered Blog Platform

A modern, full-stack blog platform built with **React + Tailwind CSS v4** frontend and **Python FastAPI** backend, featuring AI-powered writing tools, JWT authentication with email verification, and a full admin panel.

---

## ✨ Features

### Frontend
- **Modern UI** — Glassmorphism design, smooth Framer Motion animations, dark/light mode
- **Home Page** — Animated hero section, featured blogs, latest articles, categories, newsletter
- **Blog Pages** — Markdown rendering with syntax highlighting, comments, likes, share buttons
- **User Dashboard** — Create, edit, delete blogs with stats overview
- **Markdown Editor** — Live preview editor with AI tools sidebar
- **Profile Page** — User bio, social links, published blogs
- **Search** — Full-text search with category and tag filtering, pagination
- **Admin Panel** — Analytics dashboard, user & blog management

### Backend
- **FastAPI** REST APIs with automatic docs at `/api/docs`
- **JWT Authentication** with email verification
- **Blog CRUD** with slugs, categories, tags, likes, views
- **Comments** with threaded replies
- **Image Upload** — Local storage + Cloudinary support
- **Search & Pagination** — Filter by category, tag, author
- **Admin APIs** — Stats, user management, blog management

### AI Features (OpenAI)
- 🎯 Title generation
- 📝 Summary generation
- 🏷️ Tag suggestions
- ✨ Content improvement

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS v4, Framer Motion, React Router v6 |
| Editor | @uiw/react-md-editor |
| Backend | Python FastAPI, Uvicorn |
| Database | PostgreSQL, SQLAlchemy ORM |
| Auth | JWT (python-jose), bcrypt |
| AI | OpenAI API |
| Images | Local storage + Cloudinary |

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.10+
- **PostgreSQL** (create a database named `blogverse`)

### 1. Clone & Configure

```bash
# Copy environment variables
cp .env.example backend/.env

# Edit backend/.env with your settings (DATABASE_URL, SECRET_KEY, etc.)
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` with docs at `http://localhost:8000/api/docs`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### 4. Create Admin User

After starting the backend, sign up through the frontend. Then use a database tool to set `is_admin = true` and `is_verified = true` for your user in the `users` table.

---

## 📁 Project Structure

```
Blog Website/
├── frontend/              # React + Tailwind CSS v4
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # Auth & Theme providers
│   │   ├── pages/         # Route pages
│   │   ├── services/      # API layer (axios)
│   │   ├── App.jsx        # Root component with routing
│   │   └── index.css      # Tailwind v4 theme config
│   └── vite.config.js
│
├── backend/               # FastAPI
│   ├── app/
│   │   ├── api/           # Route handlers
│   │   ├── core/          # Config, DB, security
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # AI service
│   │   └── main.py        # App entry point
│   └── requirements.txt
│
├── .env.example
└── README.md
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SECRET_KEY` | ✅ | JWT signing key |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS & emails |
| `OPENAI_API_KEY` | ❌ | Enables AI features |
| `CLOUDINARY_*` | ❌ | Enables cloud image storage |
| `SMTP_*` | ❌ | Enables real verification emails |

---

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/auth/verify-email` | Verify email |
| GET | `/api/auth/me` | Current user |
| GET | `/api/blogs` | List blogs (with search/filter) |
| GET | `/api/blogs/featured` | Featured blogs |
| GET | `/api/blogs/{slug}` | Single blog |
| POST | `/api/blogs` | Create blog |
| PUT | `/api/blogs/{id}` | Update blog |
| DELETE | `/api/blogs/{id}` | Delete blog |
| POST | `/api/blogs/{id}/like` | Toggle like |
| GET/POST | `/api/blogs/{id}/comments` | Comments |
| GET/PUT | `/api/users/{username}` | User profile |
| GET | `/api/admin/stats` | Admin analytics |
| POST | `/api/ai/*` | AI tools |
| POST | `/api/upload` | Image upload |

Full interactive docs available at `/api/docs` when running the backend.

---

## 📄 License

MIT License — feel free to use this project for any purpose.
