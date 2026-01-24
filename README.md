# cf_ai_nuru_tutor

**Submission for Cloudflare AI App Optional Assignment**

**Nuru Tutor** is an AI-powered programming tutor for **Nuru** (a Swahili-based programming language). This application personalizes learning paths for students based on their experience level and age, generating custom lesson plans and interactive coding exercises.

## Assignment Components

- **LLM**: **Google Gemini 3 Preview** (via Vercel AI SDK).
  - Used for generating lesson plans, explaining code, and providing real-time feedback.
- **Workflow / Coordination**: **Cloudflare Workflows**.
  - `LessonPlanWorkflow` asynchronously generates structured, multi-step lesson paths to prevent UI blocking during complex generation tasks.
- **User input**: **Next.js (React) on Cloudflare Pages**.
  - Provides an interactive UI for chat  via `shadcn/ui` components.
- **Memory or state**: **Cloudflare D1**.
  - Persists user profiles, lesson progress, and generated curriculum using SQLite.

## Architecture decisions 

### Why OpenNext on Cloudflare?

This project uses `@opennextjs/cloudflare` to deploy Next.js 16. This is so that Next server code has direct access to Cloudflare bindings, eliminating the need to proxy requests. This approach is faster too since the workers running Next and the rest of the bindings are in the same network. Overall, this leads to faster performance.

### Why Gemini over Workers AI

It boils down to deterministic outputs and performance. For the project, I needed to use tools (i.e., function calling) to have the LLM build interactive learning experiences for the user. The output also had to be deterministic so that every feature works perfectly. Models like `@cf/meta/llama-3.1-8b-instruct` struggle with this. On top of that, performance was a bottleneck. I would often get hit with Gateway timeout errors in development. Gemini 3, on the other hand, handles streaming, structured outputs, and function calling with blazing speed.

## Future

I had a lot of fun building this project. I gained a lot of insight into building AI-driven user experiences. I am definitely adding this to my side projects and shipping it in the future. And in service to that future, here are some to-dos.

#### ORM

Our current approach to DB migrations is extremely brittle. The first and only migration I wrote manually in a `.sql` file. Fast, yes, but error-prone. I thought of adding Drizzle to the stack, but it wasn't worth the time. It is the first thing I am adding next time.

#### Internationalization

The app is geared towards Swahili learners, thus a Swahili UI and Swahili lessons from the LLM. What if the user isn't a Swahili speaker, like you, dear reader from the Cloudflare engineering team? I set up rudimentary intl using a queryParam (`?language=en`), but more work is required.

## Features

- **Personalized Onboarding**: Dynamically assesses user experience (age, prior language knowledge).
- **Interactive Code Tutor**: Real-time context-aware feedback.
- **Structured AI Outputs**: Uses JSON schemas via zod for reliable UI rendering.

## Getting Started

### Prerequisites

- Node.js (v20+)
- Cloudflare Account
- `wrangler` CLI installed globally (`npm i -g wrangler`)
- Google AI API Key (for Gemini)

### Installation

1.  Clone the repository:

```bash
git clone https://github.com/Heracraft/cf_ai_nuru_tutor.git
cd cf_ai_nuru_tutor
```

2.  Install dependencies:

```bash
npm install
```

3.  Configure Environment:
    - `GOOGLE_GENERATIVE_AI_API_KEY`: Via `wrangler secret put` for production or in `.dev.vars` for local dev.

### Running Locally

This project operates with two coordinated services: the Next.js frontend (Worker) and the independent Workflow Worker.

1.  **Frontend & API (Next.js)**
    Start the main application server:

    ```bash
    npm run dev
    ```

    _Access the app at `http://localhost:3000`_

2.  **Workflows Worker**
    In a separate terminal, start the background workflow service:
    ```bash
    npm run dev:workflows
    ```
    _This handles the asynchronous generation of lesson plans._

### Cloudflare Deployment

To deploy both the application and the workflows to Cloudflare:

```bash
npm run deploy
```

```bash
npm run deploy:workflows
```

## AI Prompts

A record of the AI prompts used to assist in building this project can be found in [PROMPTS.md](./PROMPTS.md).
