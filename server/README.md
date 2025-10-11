# Server (Express)

This small Express server exposes one protected endpoint `/api/profile` which expects an Authorization header with a Supabase access token. It verifies the token via Supabase and returns the user's `profiles` row.

Setup

1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies: `npm install`
3. Run: `npm run dev` (requires `nodemon`) or `npm start`

Security

- Keep `SUPABASE_SERVICE_KEY` secret. It's a service_role key used by the server.

Troubleshooting

- If you receive "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY" make sure `.env` is present and variables match names in `.env.example`.
- The server currently allows all CORS origins for simplicity. In production, restrict CORS to your client origin.
- Use the service_role key only on the server. Never expose it in the client.
