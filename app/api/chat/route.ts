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
