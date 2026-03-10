# Electrical Bot

Electrical safety training assistant with an Express backend, Gemini-powered chat, and a static frontend served by the same Node service.

## Local setup

1. Install dependencies:
   ```powershell
   cd backend
   npm install
   ```
2. Create `backend/.env` from `backend/.env.example`.
3. Start the app:
   ```powershell
   npm start
   ```
4. Open `http://localhost:5000`.

## Deploy on Render

This repo includes [`render.yaml`](/render.yaml) for a Render free-tier web service.

Required environment variable:

- `GEMINI_API_KEY`

Render setup:

1. Push this repo to GitHub.
2. In Render, create a new Blueprint or Web Service from the repo.
3. If using the blueprint, Render reads `render.yaml`.
4. Set `GEMINI_API_KEY` in the Render dashboard before the first successful deploy.

## Notes

- Do not commit `backend/.env`.
- The app binds to `process.env.PORT`, which Render requires for web services.
