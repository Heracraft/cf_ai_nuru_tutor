import { getCloudflareContext } from "@opennextjs/cloudflare";

import { google } from "@ai-sdk/google";

import { createWorkersAI } from "workers-ai-provider";

import {lessonResponseSchema} from "@/lib/validation"

import {
	generateObject,
	generateText,
	convertToModelMessages,
	Output,
	streamText,
} from "ai";

interface lessonRequestBody {
	messages: any[];
	language: "Swahili" | "English";
}

const NURU_DOCS = `
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

export async function POST(req: Request) {
	const body = (await req.json()) as lessonRequestBody;
	const { messages = [], language = "Swahili" } = body;

	console.log(body.messages);

	// const { env } = await getCloudflareContext({ async: true });

	// const workersAI = createWorkersAI({
	// 	binding: env.AI,
	// });

	// const model = workersAI("@cf/meta/llama-3-8b-instruct");

	const model = google("gemini-2.5-flash");

	const result = streamText({
		model,
		messages: await convertToModelMessages(messages),
		system: `
You are an AI assistant for the 'Nuru' programming language (Swahili-based). 
Use the following language specification to teach the user.
Act as an interactive tutor helping a beginner learn the programming language unit by unit. 
Assume this student is an absolute beginner.
The language used for explanation should be ${language}. 
The lesson content should be returned in .md.
Each lesson should be about one concept only like comments, only. 
Do not use hr. Start structure at ##. Keep the code line wrapped


${NURU_DOCS}
`, 

		output: Output.object({
			schema: lessonResponseSchema,
		}),
	});

	// console.log(result);

	return result.toUIMessageStreamResponse();
}
