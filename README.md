# FE-BE Login Page

A clean, secure, and extensible example implementation of a login system with a dedicated frontend and backend. This repository demonstrates best-practice patterns for authentication (session or token-based), form validation, and a straightforward project structure suitable for learning, prototyping, or using as a foundation for production work.

> NOTE: This README is intentionally implementation-agnostic — please adjust the environment variables, commands, and endpoint examples to match the concrete code in this repository.


---

## Key Features

- Separation of frontend (FE) and backend (BE) concerns.
- Example login/register flows (email + password).
- Input validation and error handling conventions.
- Token-based (JWT) or session-based authentication patterns (choose one according to the code).
- Configurable via environment variables for easy deployment.
- Clear, opinionated project layout to support growth.

## Project Structure

A suggested high-level layout (actual layout may differ — update to reflect repository contents):

- frontend/
  - src/
    - components/
    - pages/
    - services/ (API client)
    - styles/
  - public/
  - package.json
- backend/
  - src/
    - controllers/
    - middlewares/
    - models/
    - routes/
    - utils/
  - migrations/ (if using a DB)
  - package.json
- docker-compose.yml (optional)
- README.md

## Tech Stack

- Frontend: React, CSS
- Backend: Node.js + Express, RESTful JSON API.
- Auth: JWT or server-side sessions + secure cookies.
- Database: Supabase
- Tooling: ESLint, Prettier, Jest

## Getting Started

### Prerequisites

- Node.js (LTS) and npm
- Git
- (Optional) Docker & Docker Compose
- Database server (SupaBase)
### Clone

```bash
git clone https://github.com/MeghVyas3132/FE-BE-Login-page.git
cd FE-BE-Login-page
```

### Install

Install frontend and backend dependencies separately:

```bash
# From repository root (if there are separate folders)
cd client
npm install
# or
yarn install

cd ../server
npm install
# or
yarn install
```

### Environment Variables

Create .env files for both frontend and backend as needed. Example backend `.env` (adjust keys to your implementation):

```
# Backend example
PORT=4000
NODE_ENV=development
DATABASE_URL=postgres://user:password@localhost:5432/dbname
JWT_SECRET=your_very_secure_secret
JWT_EXPIRES_IN=1d
COOKIE_SECURE=false
CORS_ORIGINS=http://localhost:3000
```

### Run Locally

Start backend:

```
cd server
npm run dev
```

Start frontend:

```
cd client
npm start
```

Open the frontend at http://localhost:3000 (or the address your dev server reports) and try the registration/login flows.

## Authentication Flow

The repository demonstrates one of the common approaches:

- Frontend sends credentials (email/password) to backend `POST /auth/login`.
- Backend validates credentials and returns either:
  - A JWT in the response body (client stores it securely, e.g., in memory / secure storage), or
  - A short-lived session cookie (recommended for web apps to mitigate XSS).
- For protected requests, include Authorization header `Bearer <token>` or rely on cookies sent automatically by the browser.
- Logout endpoint invalidates cookie or advises client to discard token.

Tip: Prefer HttpOnly cookies for session tokens to reduce XSS risk; use CSRF protection when using cookies.

## API (Common Endpoints)

Adjust the paths and behaviors to match the backend code. Example endpoints:

- POST /api/auth/register
  - Body: { name, email, password }
  - Response: created user (sanitized) or error

- POST /api/auth/login
  - Body: { email, password }
  - Response: { token } or set cookie

- POST /api/auth/logout
  - Clears cookie or tells client to drop token

- GET /api/auth/me
  - Protected: returns current user profile

- PUT /api/users/:id
  - Protected/admin: update user info

