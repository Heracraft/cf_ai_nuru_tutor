# Nuru Tutor

An AI programming tutor for **Nuru**, a Swahili-based programming language. It builds a personalised lesson plan from a learner's age, prior languages, and stated experience, then teaches each lesson interactively with a runnable code playground.

Self-hosted, with Docker and Postgres. Runs against OpenAI or Gemini.

## Why it looks like this now

This started as a Cloudflare assignment submission, and the architecture showed it. D1 for storage, Workflows for a single LLM call, Workers AI alongside Gemini, OpenNext to get Next.js onto Workers. Those pieces were chosen to demonstrate a platform rather than because the app needed them, and each one added a moving part: a second deployed worker, generated binding types, a wrangler config, an HTTP hop between the app and its own background job.

The app needs a database, one model provider, and somewhere to run a background task. So it now has exactly that.

## Architecture

| Concern | Choice | Reasoning |
| --- | --- | --- |
| Database | Postgres via Drizzle | A managed service in Coolify with real backups, rather than a volume to remember to snapshot. Drizzle replaces a hand-written SQL migration. |
| Background work | In-process, via Next's `after()` | Plan generation is one LLM call under 15 seconds. A queue or a second container would be machinery around a single request. |
| Progress reporting | Server-sent events | The client watches the job rather than polling for it. |
| Model provider | OpenAI, falling back to Gemini | Chosen by which key is present, so the same image runs either way. |

### How plan generation works

1. `POST /api/onboarding` inserts the user and a `generation_jobs` row, then returns immediately. The form never waits on a model.
2. Generation continues in `after()`. It streams an array of lessons, writing each one to Postgres as it completes.
3. The dashboard subscribes to `/api/generation/[jobId]/stream`. That endpoint first replays current job state and any lessons already written, then switches to live events, so a reload, a late arrival, or a dropped connection all end up with the same picture.
4. Stage markers cover the gap before the first lesson lands. Once lessons start arriving, cards appear one at a time.

Two clocks guard a stuck run. The model call aborts at 90 seconds. Separately, the dashboard treats a job that has stopped reporting for two minutes as dead and offers a retry, which is what a mid-run process restart looks like from the outside.

### Cost shape

Lessons are generated once and stored in `lessons.content`. Reopening a lesson serves the stored copy, so it costs nothing and shows the same lesson it did last time.

Three call profiles, each overridable by env var:

| Profile | Default | Why |
| --- | --- | --- |
| `chat` | `gpt-5-mini`, low reasoning | Streams a structured object the client parses incrementally. A schema slip blanks the screen. |
| `plan` | `gpt-5-mini`, low reasoning | Once per student, and the first thing they read. Nano-tier wrote broken Swahili here. |
| `help` | `gpt-5-nano`, minimal reasoning | Frequent, small, cheap to retry. |

## Running it

### With Docker

```bash
cp .env.example .env      # set OPENAI_API_KEY and a real POSTGRES_PASSWORD
docker compose up --build
```

The app comes up on `http://localhost:3000`. Migrations apply automatically before the server starts.

### Locally

Requires Node 24+, pnpm, and a Postgres you can reach.

```bash
pnpm install
cp .env.example .env.local     # set DATABASE_URL and OPENAI_API_KEY
pnpm db:migrate
pnpm dev
```

### Deploying to Coolify

Point Coolify at this repo and choose Docker Compose as the build pack. Set `OPENAI_API_KEY` and a real `POSTGRES_PASSWORD` on the service. `DATABASE_URL` is assembled inside `docker-compose.yml` from the Postgres variables, so leave it alone.

Deploys restart the whole stack, which means a few seconds of downtime. That is a deliberate trade for keeping the setup to one compose file; see [TODO.md](./TODO.md).

## Configuration

| Variable | Default | Notes |
| --- | --- | --- |
| `DATABASE_URL` | none, required | Postgres connection string. |
| `OPENAI_API_KEY` | none | `OPEN_AI_API_KEY` is accepted too. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | none | Used when no OpenAI key is present. |
| `AI_PROVIDER` | by key presence | Force `openai` or `google`. |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Point at OpenRouter, Groq, or a local vLLM. |
| `AI_MODEL_CHAT` | `gpt-5-mini` | |
| `AI_MODEL_PLAN` | `gpt-5-mini` | |
| `AI_MODEL_HELP` | `gpt-5-nano` | |

At least one provider key is required. The app throws on boot without one, rather than on a student's first click.

## Database

```bash
pnpm db:generate   # generate a migration after editing lib/db/schema.ts
pnpm db:migrate    # apply pending migrations
pnpm db:studio     # browse the data
```

Three tables: `users` holds the onboarding profile, `lessons` holds the plan and each generated body, `generation_jobs` tracks a generation run so the SSE endpoint has something durable to replay.

## Known gaps

There is no authentication. A user id lives in `localStorage` and travels in the query string, so anyone holding an id can open that learner's plan. Fine for a self-hosted instance, not fine for a public one. That and the rest are tracked in [TODO.md](./TODO.md).

## AI prompts

A record of the prompts used while building this is in [PROMPTS.md](./PROMPTS.md).
