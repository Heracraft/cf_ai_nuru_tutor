import { eq } from "drizzle-orm";
import { Output, streamText } from "ai";

import { getModel, getProviderOptions } from "@/lib/ai";
import { db } from "@/lib/db";
import { generationJobs, lessons } from "@/lib/db/schema";
import { NURU_DOCS } from "@/lib/nuru-docs";
import { LESSON_PLAN_SIZE, lessonPlanItemSchema } from "@/lib/validation";

import { publish, type GenerationStage } from "./events";

/** Hard ceiling on a generation run, so a hung call cannot pin a job forever. */
const GENERATION_TIMEOUT_MS = 90_000;

export interface GenerationInput {
	jobId: string;
	userId: string;
	age: string;
	language: string;
	experienceLevel: string;
	targetLanguage: string;
}

async function setStage(jobId: string, stage: GenerationStage) {
	await db
		.update(generationJobs)
		.set({ stage, status: "running", updatedAt: new Date() })
		.where(eq(generationJobs.id, jobId));

	publish(jobId, { type: "stage", stage });
}

function buildPrompt(input: GenerationInput) {
	const { age, language, experienceLevel, targetLanguage } = input;

	return `
Design a ${LESSON_PLAN_SIZE}-lesson introductory course in the Nuru programming language for this learner:
- Age: ${age}
- Previous programming languages: ${language || "none"}
- Self-reported experience: ${experienceLevel}

Hard constraints. Follow every one of them.
1. Return exactly ${LESSON_PLAN_SIZE} lessons, ordered so that no lesson depends on a concept taught in a later lesson.
2. Only cover concepts that appear in the specification below. Do not invent Nuru syntax, keywords, or built-in functions.
3. Each lesson teaches exactly one concept. Do not bundle unrelated topics into a single lesson.
4. Lesson 1 must be reachable by someone who has never programmed, unless the learner reports prior experience.
5. Titles must be written in ${targetLanguage} and must name the concept concretely. Reject vague titles such as "Getting Started" or "Advanced Topics".
6. The slug must be lowercase ASCII kebab-case and must not repeat across lessons.
7. Set emphasisLevel by how much drilling this specific learner needs: someone arriving from Python needs "low" on variables and loops, while an absolute beginner needs "high".
8. Pitch the wording for a ${age}-year-old. Do not write childishly for an adult, and do not write academically for a twelve-year-old.

Nuru language specification, the only source of truth for what the language can do:

${NURU_DOCS}
`.trim();
}

/**
 * Generates a lesson plan and writes each lesson as it arrives.
 *
 * Runs in-process via after(), so nothing outside this function retries it. A
 * crash mid-run leaves the job row on "running", which the dashboard treats as
 * stale after two minutes and offers to retry.
 */
export async function runGeneration(input: GenerationInput): Promise<void> {
	const { jobId, userId, targetLanguage } = input;

	try {
		await setStage(jobId, "profile");

		const { elementStream } = streamText({
			model: getModel("utility"),
			providerOptions: getProviderOptions("utility"),
			abortSignal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
			prompt: buildPrompt(input),
			output: Output.array({
				element: lessonPlanItemSchema,
			}),
		});

		await setStage(jobId, "syllabus");

		let order = 0;
		let announcedWriting = false;

		for await (const item of elementStream) {
			if (!announcedWriting) {
				announcedWriting = true;
				await setStage(jobId, "writing");
			}

			order += 1;

			const [inserted] = await db
				.insert(lessons)
				.values({
					userId,
					title: item.title,
					slug: item.slug,
					emphasisLevel: item.emphasisLevel,
					order,
				})
				.returning();

			await db
				.update(generationJobs)
				.set({ updatedAt: new Date() })
				.where(eq(generationJobs.id, jobId));

			publish(jobId, {
				type: "lesson",
				lesson: {
					id: inserted.id,
					title: inserted.title,
					slug: inserted.slug,
					emphasisLevel: inserted.emphasisLevel ?? "medium",
					order: inserted.order,
				},
			});
		}

		if (order === 0) {
			throw new Error(
				`The model returned no lessons for ${targetLanguage}. Try again.`,
			);
		}

		await db
			.update(generationJobs)
			.set({ status: "complete", stage: "done", updatedAt: new Date() })
			.where(eq(generationJobs.id, jobId));

		publish(jobId, { type: "complete", count: order });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Lesson plan generation failed.";

		console.error(`Generation job ${jobId} failed:`, error);

		await db
			.update(generationJobs)
			.set({ status: "error", error: message, updatedAt: new Date() })
			.where(eq(generationJobs.id, jobId));

		publish(jobId, { type: "error", message });
	}
}
