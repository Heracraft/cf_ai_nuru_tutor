This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Architecture Journey

This project was built as a Cloudflare-native application to explore the intersection of modern meta-frameworks (Next.js) and Edge computing. Below are the key architectural pivots made during development.

### 1. Runtime Pivot: Vanilla Node.js &rarr; OpenNext on Cloudflare Workers
**Context:**  
Next.js typically runs on a Node.js server (or Vercel's managed infrastructure). However, the assignment required a "Cloudflare-native" approach.

**The Pivot:**  
I migrated from the standard Next.js runtime to **@opennextjs/cloudflare**.

**Reasoning:**
- **Alignment:** This fulfills the requirement to build on Cloudflare Workers/Pages while retaining the developer experience of Next.js App Router.
- **Integration:** Running directly on the specific `nodejs_compat` compatibility flag in `wrangler.jsonc` allows direct binding access to `env.AI` (Workers AI) without needing complex REST API bridges or external secrets management.
- **Trade-offs:** We lose some Node.js specific APIs but gain significant improvements in cold-boot times and edge latency.

### 2. Interaction Model: Text Streaming &rarr; Structured JSON
**Context:**  
An educational tutor needs to distinctively separate "Concept Explanations" from "Code Examples" to render them in different UI components (Markdown viewer vs. Code Editor).

**The Pivot:**  
I moved from `generateText` with streaming to `generateText` with `json-mode` (Zod Schema).

**Reasoning:**
- **Reliability:** Llama 3 provides excellent reasoning, but parsing unstructured text streams into specific UI components is fragile.
- **Constraint:** As noted in development, the Vercel AI SDK currently does not support `stream: true` simultaneously with `json` mode for all providers.
- **Decision:** I prioritized structural integrity over the "typing effect" UI. The app now waits for a complete, valid JSON object containing `{ lessonContent, sampleCode }` before rendering, ensuring the Code Editor never receives malformed text.

### 3. AI Model Strategy
**Choice:** Llama 3 (via Workers AI)
**Why:**  
- **Latency:** Running the model on Cloudflare's global network reduces the round-trip time compared to calling an external API (like OpenAI).
- **Privacy/Security:** The request never leaves the Cloudflare ecosystem.

## Stack Overview
- **Framework:** Next.js 15 (App Router)
- **Runtime:** Cloudflare Workers (via OpenNext)
- **AI:** Workers AI (@cf/meta/llama-3-8b-instruct)
- **Styling:** Tailwind CSS + Shadcn UI