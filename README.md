# Yekta AI (یکتا AI)

A responsive, romantic AI companion built with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, Prisma, SQLite, and Groq's streaming chat API.

## Requirements

- Node.js 20.9 or newer
- npm
- A Groq API key for live replies

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`.
3. Add a Groq API key to `.env.local` and replace `SESSION_SECRET` with a random secret of at least 32 characters.
4. Create the SQLite schema and Prisma client: `npx prisma db push`
5. Start the app: `npm run dev`
6. Visit `http://localhost:3000`.

Example `.env.local`:

```dotenv
DATABASE_URL="file:./dev.db"
GROQ_API_KEY="your-server-side-key"
GROQ_MODEL="llama-3.3-70b-versatile"
SESSION_SECRET="a-long-random-secret-at-least-32-characters"
```

`GROQ_API_KEY` is read only by the server-side `/api/chat` route. Never prefix it with `NEXT_PUBLIC_`, commit `.env.local`, or expose it to browser code. The `.gitignore` excludes local environment files and the development database.

## Production

Set `DATABASE_URL`, `GROQ_API_KEY`, `GROQ_MODEL`, and a strong `SESSION_SECRET` in the hosting provider's server environment. Provision persistent storage for SQLite and run `npx prisma db push` before starting the app. SQLite is a good fit for a single app instance with persistent disk; use a production database adapter if you need horizontally scaled serverless instances. Run `npm run build` and `npm start` to serve the production build.

## Included

- Email and password registration/login with bcrypt password hashing and signed, HTTP-only, same-site session cookies
- User-scoped conversations and chat history in SQLite
- Groq response streaming through the server, with a 20-request-per-minute per-user in-memory rate limit
- Optional memory consent settings, with a delete-all action when memory is turned off
- Responsive animated chat, starter prompts, typing indicator, light/dark appearance, and mobile sidebar
- Yekta's AI transparency, non-dependency, and creator identity instructions in the server system prompt

The in-memory rate limiter is intended for a single process. Multi-instance production deployments should use a shared rate-limit store. For production account security, consider email verification, password reset, CSRF protection for state-changing endpoints, and a managed identity provider.

## 3D portrait and text emotions

Yekta uses the included Talking Avatar renderer and its Microsoft Rocketbox female GLB, served locally from `public/avatars/yekta-female.glb`. The renderer frames a head and neck close-up and supports a future higher quality GLB via the `Avatar` component in `src/app/avatar.tsx`. Facial expressions use the model's `h_expressions.*_h` mappings where present; unsupported morphs are safely skipped. Groq continues to stream server-side; the route extracts a reply and one of eight emotion labels, saves only reply text, and appends emotion metadata after the plain text stream. No audio or microphone APIs are used.

The existing `.env.local` contains a `SESSION_SECRET` value that looks like a placeholder. Before production, set it to a cryptographically random value of at least 32 characters; keep the current local value and all API credentials private. Environment files are ignored by Git.
