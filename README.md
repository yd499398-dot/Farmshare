# FarmShare

FarmShare is a Vite + React farmer marketplace with an Express API, MongoDB Atlas persistence, JWT authentication, and Gmail SMTP email verification.

## Architecture

- Frontend: Vite + React → Vercel
- Backend: Express + Node → Render
- Database: MongoDB Atlas
- Email: Gmail SMTP using a Google App Password stored only as a server environment variable
- Authentication: JWT for the FarmShare API; Firebase remains only for the optional Google sign-in popup

## Local development

1. Copy `.env.example` to `.env`.
2. Put your MongoDB connection string, JWT secret and Gmail SMTP values in `.env`.
3. Run `npm install`.
4. Run `npm run dev`.
5. For a separate Vite frontend against a deployed API, set `VITE_API_URL`.

## Production

Deploy the backend as a Render Web Service using `npm install && npm run build:server` and `npm start`.
Deploy the Vite frontend to Vercel using `npm run build:client`, output directory `dist`.
Set `VITE_API_URL` in Vercel to the Render API URL.

Never commit `.env`, Gmail App Passwords, MongoDB credentials or JWT secrets.

## Security note

The previous project contained a Gmail App Password in server code/environment. That credential must be revoked in Google before using this repository. Put the replacement App Password only in Render's environment variables; never commit it to GitHub or put it in Vercel frontend variables.
