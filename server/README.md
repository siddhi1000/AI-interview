# Backend API (Express + Prisma + Clerk)

## Setup

1. Create a Postgres database and set `DATABASE_URL`.
2. Create a Clerk app and set `CLERK_SECRET_KEY` (server) and `VITE_CLERK_PUBLISHABLE_KEY` (frontend).
3. Generate a 32-byte encryption key and set `FIELD_ENCRYPTION_KEY` (base64).
4. Install deps and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

5. Start API:

```bash
npm run dev:server
```

## Authentication

Frontend calls the API with `Authorization: Bearer <Clerk JWT>`. All `/api/*` routes (except `/api/health`) require a valid Clerk session.

## Authorization (Admin)

Admin access is controlled by:

- `ADMIN_EMAIL_ALLOWLIST` (server): comma-separated emails that are always treated as admin.
- `publicMetadata.role` in Clerk: if set to `admin`, the user is treated as admin unless overridden by allowlist rules.

## Data Protection

- SQL injection: Prisma parameterization.
- Sensitive fields: `phone` is stored encrypted using AES-256-GCM (`FIELD_ENCRYPTION_KEY`).
- File uploads: resumes are validated (PDF/DOCX/TXT), stored on disk, hashed (sha256), and parsed to extracted text.

## LLM Assessment (Gemini)

### Environment

- `GEMINI_API_KEY`: server-side API key (do not expose to browser).
- `GEMINI_MODEL`: defaults to `gemini-1.5-flash`.
- `GEMINI_RPM_PER_USER`, `GEMINI_RPD_PER_USER`: per-user quotas enforced by middleware.

### Endpoints

- `POST /api/interviews/:id/questions/generate` -> generates 8–10 questions from Profile + latest Resume text.
- `GET /api/interviews/:id/questions` -> lists generated questions.
- `POST /api/interviews/:id/answers` -> stores answers for generated questions.
- `POST /api/interviews/:id/assessment/generate` -> evaluates answers and persists an assessment + updates `InterviewFeedback`.

## Backup & Recovery (Postgres)

### Backup

```bash
pg_dump --format=custom --file=backup.dump "$DATABASE_URL"
```

### Restore

```bash
pg_restore --clean --if-exists --dbname="$DATABASE_URL" backup.dump
```

## Indexing

Indexes are defined in `server/prisma/schema.prisma` via `@@index` and applied by migrations.

