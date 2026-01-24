import { getCloudflareContext } from "@opennextjs/cloudflare";

import { google } from "@ai-sdk/google";

import { createWorkersAI } from "workers-ai-provider";

import { lessonResponseSchema } from "@/lib/validation"

import {
  convertToModelMessages,
  Output,
  streamText,
} from "ai";
import { z } from "zod";

interface lessonRequestBody {
  messages: any[];
  language: "Swahili" | "English";
}

export const NURU_DOCS = `
# NURU LANGUAGE SPECIFICATION

## 1. COMMENTS & IDENTIFIERS
- **Single-line:** \`// comment\`
- **Multi-line:** \`/* comment */\`
- **Identifiers:** Alphanumeric + \`_\`. Cannot start with a number. Case-sensitive.
  - Example: \`fanya mwaka_wa_kuzaliwa = 2020\`

## 2. DATA TYPES & PRIMITIVES
- **Types:** \`namba\` (int/float), \`tungo\` (string), \`buliani\` (bool), \`tupu\` (null), \`vitendakazi\` (functions).
- **Booleans:** \`kweli\` (true), \`sikweli\` (false). All values are true except \`tupu\` and \`sikweli\`.
- **Operators:** \`&&\` (AND), \`||\` (OR), \`!\` (NOT), \`%\` (modulo), \`+\` (concat for lists/dicts).

## 3. ARRAYS (SAFU)
- **Syntax:** \`arr = [1, "two", kweli]\`
- **Indexing:** Zero-based. Access: \`arr[0]\`. Modify: \`arr[1] = 25\`.
- **Operations:**
  - \`+\`: Concatenate arrays (\`a + b\`).
  - \`ktk\`: Membership check (\`val ktk arr\` -> returns bool).
- **Methods:**
  - \`arr.idadi()\`: Returns length.
  - \`arr.sukuma(items...)\`: Pushes items to end.
  - \`arr.yamwisho()\`: Returns last element (or \`tupu\` if empty).

## 4. DICTIONARIES (KAMUSI)
- **Syntax:** \`d = {"key": "val", "num": 1}\`. Keys can be string, number, or bool.
- **Access:** \`d["key"]\`.
- **Modify/Add:** \`d["newKey"] = val\`.
- **Operations:**
  - \`+\`: Merge dictionaries (\`d1 + d2\`).
  - \`ktk\`: Check if Key exists (\`"key" ktk d\`).

## 5. CONTROL FLOW
### Conditionals
\`\`\`go
kama (condition) {
    // code
} sivyo {
    // code
}

\`\`\`

### Loops (Vitanzi)

Used for strings, arrays, and dictionaries.

* **Keywords:** \`kwa\` (for), \`ktk\` (in), \`vunja\` (break), \`endelea\` (continue).
* **Value Loop:**
\`\`\`go
kwa val ktk collection { andika(val) }

\`\`\`


* **Key/Index + Value Loop:**
\`\`\`go
kwa idx, val ktk collection { andika(idx, val) }

\`\`\`


*(Note: For dicts, \`idx\` is the Key)*

### Range (Mfululizo)

Generates arrays of numbers.

* \`mfululizo(end)\`: 0 to end-1.
* \`mfululizo(start, end)\`: start to end-1.
* \`mfululizo(start, end, step)\`: custom step.

## 6. FUNCTIONS (UNDO)

Functions are first-class citizens defined via \`unda\` and assigned to variables.

* **Syntax:**
\`\`\`go
myFunc = unda(param1, param2="default") {
    rudisha param1 + param2
}

\`\`\`


* **Features:** Supports closures, recursion, and implicit returns via \`rudisha\`.

## 7. BUILT-IN FUNCTIONS (VITENDAKAZI)

* \`andika(args...)\`: Print to console. Supports \`\\n\`, \`\\t\`.
* \`jaza(prompt)\`: Input from user. Returns string.
* \`aina(obj)\`: Returns type as string (e.g., "NAMBA").
* \`fungua(path)\`: Opens a file reference.
`;

interface lessonRequestBody {
  messages: any[];
  language: "Swahili" | "English";
  lessonContext?: {
    title: string;
    emphasisLevel: string;
  };
  userProfile?: {
    age: string;
    experienceLevel: string;
    language: string;
  };
}

// ... NURU_DOCS string ... (Keep it as is, or use a variable if available, but here I will assume I need to keep the file content or I can target just the function)
// Since I can't target "just the function" easily without proper context of NURU_DOCS being preserved if I replace the whole file? 
// I will use replace_file_content on the function ONLY.

export async function POST(req: Request) {
  const body = (await req.json()) as lessonRequestBody;
  const { messages = [], language = "Swahili", lessonContext, userProfile } = body;

  // console.log(body.messages);

  const model = google("gemini-3-flash-preview");

  let systemPrompt = `
You are an AI assistant for the 'Nuru' programming language (Swahili-based). 
Use the following language specification to teach the user.
Act as an interactive tutor helping a beginner learn the programming language unit by unit. 
Assume this student is an absolute beginner.
The language used for explanation should be ${language}. 
The lesson content should be returned in .md.
Each lesson should be about one concept only like comments, only. 
Do not use hr. Start structure at ##. Keep the code line wrapped
  `;

  if (lessonContext && userProfile) {
    systemPrompt = `
You are Nuru, an expert AI tutor for the Nuru programming language (Swahili-based). 
User Profile:
- Age: ${userProfile.age}
- Experience: ${userProfile.experienceLevel} (Previous: ${userProfile.language})

Current Lesson: ${lessonContext.title}
Emphasis Level: ${lessonContext.emphasisLevel}

Your goal is to teach this specific lesson.
1. Start by introducing the concept in Swahili, but keep it simple based on the user's age/level.
2. Make sure to provide code examples. You can use Markdown code blocks to show code examples.
3. Ask the user to try writing code. Call the generateExercises tool to generate a coding exercise.
4. Correct them gently if they make mistakes.
5. If the lesson is completed, suggest moving to the next one.

Use the following language specification as reference:
    `;
  }

  systemPrompt += `\n\n${NURU_DOCS}`;

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
    system: systemPrompt,
    output: Output.object({
      schema: lessonResponseSchema,
    }),

    // tools: {
    //   generateExercises: {
    //     description: "Generates a coding exercise for the student. Call this on every new lesson to test the student's understanding.",
    //     inputSchema: z.object({
    //       initialCode: z.string(),
    //       targetOutput: z.string(),
    //     }),
    //   },
    // },
  });

  return result.toUIMessageStreamResponse();
}
