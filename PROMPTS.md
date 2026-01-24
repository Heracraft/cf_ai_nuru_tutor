- `add the tailwind Class Sorting plugin for Prettier. use pnpm`, model: Gemini 3 Pro
- `How do i pivot from single prompt completion to chat completions. add this prompt to PROMPTS.md`, model: Gemini 3 Pro
- `Use the attached condensed docs for the custom programming language Nuru, to add an initial system prompt that instructs the llm to act as a tutor helping a bigginner learn the programming language lesson by lesson. They should assume this student is an absolute begginer. The language used should be configurable (use template strings with a default value of swahili). The lesson content should be returned in .md.`, model: Gemini 3 Pro
- `does setting a response schema also make the schema apply to prompts sent by the user? add this to PROMPTS.md`, model: Gemini 3 Pro
- `According to the docs, JSON Schema mode is not supported with stream mode. You can only have either. I choose to stick with JSON schema, remove streaming from the codebase. Add this to prompts.md`, model: Gemini 3 Pro
- `this is the expected shape of the message, parse the data using JSON.parse and add the necessary type annotations, [attached js object]`, model: Gemini 3 Pro
- 
    Here is a plan to introduce learning progress tracking. It involves using cloudflare workflows, defined in @src Using a db, a Cloudflare D1 db binding is already defined. The LLM of choice is  "gemini-2.5-flash". use shadcn/ui

    -Homepage: onboarding style page where the learner describes the experience level in a form ( previous language, age for example) This is used to create an anonymous user account which can later be claimed. This info is saved in the db. 

    -> From the entered data, a cloudflare workflow is triggered the generates a lesson plan for the user. The lesson plan is json list of lesson objects -> title, id, uid, emphasisLevel. emphasis level determines how early the lesson will be, how many comments and how many tests for each lesson. 

    -Dashboard [/dashboard/] page, a page where the user can view the progressed in horizontal linear progression history. Completed lesson should be ticked green. Take this implies that the user is lesson plan should be pulled on load via React server component and passed down to a client component 

    -`lesson/[ID]/page.tsx`. The current homepage 
    page.tsx
    but this time the lesson title is pulled from DB and used to prompt the LLM. The RSC pattern should be enforced here too.  this means that each lesson card item in the horizontal list in dashboard page should be an anchor link pointing to the lesson page (this) with the respective ID passed as a slug. 

    Model: Gemini 3 Pro (high)

- `Consolidate @[workflows/wrangler.jsonc]  into @[wrangler.jsonc] , the goal is to remove @[workflows/package.json] as an independent package and consolidate it into the root package. The workflow code @[workflows/src/index.ts] should remain as /workflows/index.ts. The goal is to have two separate Workers in the same repo/package, one the pre-existing worker that deploys next.js and another  that is a worker that can be called inside next.js via a route handler.`, model: Gemini 3 Pro (High)

- `Modify @[workflows/index.ts]  to use google's api directly. We are already using google's api for gemini-flash in @[app/api/chat/route.ts]   no need to double bill with cf/ai. a  GOOGLE_GENERATIVE_AI_API_KEY is available in .dev.vars and in production via wrangler secret put...`, model: Gemini 3 Pro

- `@[workflows/index.ts:L52-L70] Gemini has exceptional support for structured outputs. Declare a schema in @[lib/validation.ts] and import it then set it as the expected output. Use @[app/api/chat/route.ts] as a reference. This means you can remove the part of the system prompt where you specify the structure of the output`, model: Gemini 3 Pro