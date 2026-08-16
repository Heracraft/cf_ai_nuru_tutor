import { and, eq, isNull } from "drizzle-orm";
import { convertToModelMessages, Output, streamText } from "ai";

import { getModel, getProviderOptions } from "@/lib/ai";
import { db } from "@/lib/db";
import { lessons } from "@/lib/db/schema";
import { NURU_DOCS } from "@/lib/nuru-docs";
import { isUuid } from "@/lib/utils";
import { lessonResponseSchema } from "@/lib/validation";

interface LessonRequestBody {
	messages: any[];
	language: "Swahili" | "English";
	lessonId?: string;
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

export async function POST(req: Request) {
	const url = new URL(req.url);
	const paramLanguage = url.searchParams.get("language");

	const body = (await req.json()) as LessonRequestBody;
	let { messages = [], language = "Swahili" } = body;
	const { lessonContext, userProfile, lessonId } = body;

	if (paramLanguage?.toLowerCase() === "english") {
		language = "English";
	}

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
You are an AI assistant for the 'Nuru' programming language (Swahili-based).
User Profile:
- Age: ${userProfile.age}
- Experience: ${userProfile.experienceLevel} (Previous: ${userProfile.language})

Current Lesson: ${lessonContext.title}
Emphasis Level: ${lessonContext.emphasisLevel}

Your goal is to teach this specific lesson.
1. Start by introducing the concept in ${language}, but keep it simple based on the user's age/level.
2. Make sure to provide code examples. You can use Markdown code blocks to show code examples.
3. Ask the user to try writing code, and provide a matching exercise.
4. Correct them gently if they make mistakes.
5. If the lesson is completed, suggest moving to the next one.

Rules for every code block and exercise. These are not style preferences;
breaking them produces code the student runs and sees fail.

a. Only use syntax and built-ins that appear in the specification below. Never
   borrow from Python, JavaScript, or Go.
b. \`andika\` does not add a line break, and joins multiple arguments with a
   space. Build one string with \`+\` and print that: \`andika("Urefu: " +
   tungo(n) + "\\n")\`. Passing \`"\\n"\` as a separate argument leaves a stray
   space before the line break, which breaks any exact-output comparison.
   \`+\` requires both sides to be strings, so wrap numbers in \`tungo()\`.
c. Every code block must run standalone: define each variable it uses, and use
   no undefined helper.
d. The exercise's targetOutput must be the exact text the console shows when the
   exercise is solved correctly, including spaces and line breaks. Derive it by
   reading your own instructions literally.
e. Because of (d), never ask for values only the student knows, like their own
   name or age. Give concrete values to use, so a correct solution always
   produces exactly the targetOutput.
f. initialCode is a starting point the student edits: include the comments and
   any scaffolding, but leave the part being taught for them to write.

Use the following language specification as reference:
    `;
	}

	systemPrompt += `\n\n${NURU_DOCS}`;

	const result = streamText({
		model: getModel("chat"),
		providerOptions: getProviderOptions("chat"),
		messages: await convertToModelMessages(messages),
		system: systemPrompt,
		output: Output.object({
			schema: lessonResponseSchema,
		}),
		async onFinish({ text }) {
			if (!lessonId || !isUuid(lessonId) || !text) return;

			// Only the first completed turn is stored, which is the lesson body
			// itself. The IS NULL guard makes that true even if two tabs race,
			// and keeps later chat turns from overwriting the lesson.
			try {
				await db
					.update(lessons)
					.set({ content: text })
					.where(and(eq(lessons.id, lessonId), isNull(lessons.content)));
			} catch (error) {
				// A failed write costs a regeneration next visit, not the lesson.
				console.error(`Failed to persist lesson ${lessonId}:`, error);
			}
		},
	});

	return result.toUIMessageStreamResponse();
}
