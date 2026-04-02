# Login Feature Portal

A full-stack web application with user authentication built using React, Node.js/Express, PostgreSQL, and JWT.

## Quick Start

### Prerequisites
- **Node.js** v18+
- **PostgreSQL** installed and running
- Create a database: `CREATE DATABASE login_portal;`

### 1. Database Setup
```bash
psql -U postgres -d login_portal -f backend/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env      # Edit with your Postgres credentials & JWT secret
npm install
npm run dev                # Starts on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                # Starts on http://localhost:5173
```

### 4. Open `http://localhost:5173` and register a new account!

## Project Structure
```
├── backend/
│   ├── config/db.js          # PostgreSQL connection pool
│   ├── middleware/auth.js    # JWT verification middleware
│   ├── routes/auth.js        # Register & Login endpoints
│   ├── schema.sql            # Users table DDL
│   ├── server.js             # Express entry point
│   └── .env.example          # Environment variables template
└── frontend/
    └── src/
        ├── context/AuthContext.jsx   # Auth state management
        ├── components/ProtectedRoute.jsx
        ├── pages/Login.jsx
        ├── pages/Register.jsx
        ├── pages/Dashboard.jsx
        └── App.jsx                   # Router configuration
```

## API Endpoints

| Method | Endpoint              | Auth | Description                |
|--------|-----------------------|------|----------------------------|
| POST   | `/api/auth/register`  | No   | Create new user account    |
| POST   | `/api/auth/login`     | No   | Login and receive JWT      |
| GET    | `/api/dashboard`      | Yes  | Protected dashboard data   |
| GET    | `/api/health`         | No   | Server health check        |
