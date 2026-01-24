# cf_ai_nuru_tutor

An AI-powered programming tutor for **Nuru** (a Swahili-based programming language). This application personalizes learning paths for students based on their experience level and age, generating custom lesson plans and interactive coding exercises.

## Features

- **Personalized Onboarding**: Dynamically assesses user experience (age, prior language knowledge) to tailor the curriculum.
- **AI-Generated Lesson Plans**: Utilizes **Cloudflare Workflows** to asynchronously generate structured, multi-step lesson paths.
- **Interactive Code Tutor**: Provides real-time, context-aware code explanations and examples using **Google Gemini 2.5 Flash**.
- **Progress Persistence**: Tracks completed lessons and user state using **Cloudflare D1** (SQLite).
- **Structured AI Outputs**: Leveraging JSON schemas to strictly separate educational text from code examples for a robust UI experience.

## Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Runtime**: Cloudflare Workers (via [OpenNext](https://opennext.js.org/cloudflare))
- **AI Model**: Google Gemini 2.5 Flash (via Vercel AI SDK)
- **Database**: Cloudflare D1
- **Orchestration**: Cloudflare Workflows
- **Styling**: Tailwind CSS + Shadcn UI

## Getting Started

### Prerequisites

- Node.js (v20+)
- Cloudflare Account
- `wrangler` CLI installed globally (`npm i -g wrangler`)
- Google AI API Key (for Gemini)

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/your-username/cf_ai_nuru_tutor.git
    cd cf_ai_nuru_tutor
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Configure Environment:
    Ensure you have your Cloudflare bindings and API keys set up.
    - `GOOGLE_GENERATIVE_AI_API_KEY`: Set securely via `wrangler secret put` or in `.dev.vars`.

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

_Note: This runs `opennextjs-cloudflare deploy` for the app. You may need to deploy the workflow worker separately if not configured to deploy together._

```bash
npm run deploy:workflows
```

## Architecture Notes

### Why OpenNext on Cloudflare?

This project uses `@opennextjs/cloudflare` to deploy Next.js 15 to Cloudflare Workers with `nodejs_compat`. This allows us to use standard React Server Components while maintaining direct access to Cloudflare bindings (D1, Workflows) via the `env` object, without needing to proxy requests through external APIs.

### Workflows for Lesson Generation

Lesson plan generation is computationally expensive and latency-sensitive. By offloading this 'reasoning' step to **Cloudflare Workflows**, we ensure the user interface remains responsive. The workflow asynchronously queries the LLM, parses the structured response, and populates the D1 database with the new curriculum.

## AI Prompts

A record of the AI prompts used to assist in building this project can be found in [PROMPTS.md](./PROMPTS.md).
