# React + Express + Supabase Login Example

This workspace contains a minimal example showing a React client (Vite) using Supabase for authentication, and a small Express server that verifies Supabase JWTs and returns the user's `profiles` row.

Folders:
- `server/` - Express server that verifies tokens and fetches profile from Supabase DB
- `client/` - Vite + React app with a login form using `@supabase/supabase-js`

See `server/.env.example` and `client/.env.example` for required environment variables.

Follow the READMEs in each folder to run.

Quick start

1. Fill `server/.env` and `client/.env` from the examples with your Supabase project values.
2. From `server/`: npm install && npm run dev
3. From `client/`: npm install && npm run dev

Notes about your Supabase SQL

The SQL you provided creates `profiles` and `calculations` and associated RLS policies and triggers. This example expects a `profiles` table shaped as in your SQL. Keep using your SQL in Supabase; this client/server will read from `profiles`.
