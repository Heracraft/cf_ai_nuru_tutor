import {
	WorkflowEntrypoint,
	WorkflowEvent,
	WorkflowStep,
} from "cloudflare:workers";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText, Output } from "ai";
import { lessonPlanSchema } from "../lib/validation";

type Env = {
	AI: any;
	nuru_tutor_db: any;
	LESSON_PLAN_WORKFLOW: any;
};

type Params = {
	userId: string;
	age: string;
	language: string;
	experienceLevel: string;
};

type Lesson = {
	id: string;
	title: string;
	slug: string;
	emphasisLevel: string;
	order: number;
};

export class LessonPlanWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		const { userId, age, language, experienceLevel } = event.payload;

		const generatedLessons = await step.do("generate lesson plan", async () => {
			const prompt = `
        Create a lesson plan for a user with the following profile:
        - Age: ${age}
        - Previous Language: ${language}
        - Experience Level: ${experienceLevel}
        
        Generate a list of 5 lessons.
      `;

			const google = createGoogleGenerativeAI();

			const { output } = await generateText({
				model: google("gemini-2.5-flash"),
				output: Output.object({
					schema: lessonPlanSchema
				}),
				prompt: prompt,
			});

			return output;
		});

		await step.do("save lessons to db", async () => {
			const stmt = this.env.nuru_tutor_db.prepare(
				`INSERT INTO lessons (id, user_id, title, slug, emphasis_level, "order") VALUES (?, ?, ?, ?, ?, ?)`
			);

			const batch = generatedLessons.map((lesson: any, index: number) => {
				return stmt.bind(
					crypto.randomUUID(),
					userId,
					lesson.title,
					lesson.slug,
					lesson.emphasisLevel,
					index + 1
				);
			});

			await this.env.nuru_tutor_db.batch(batch);
		});

		return { success: true, count: generatedLessons.length };
	}
}

export default {
	async fetch(req: Request, env: Env): Promise<Response> {
		if (req.method !== "POST") {
			return new Response("Method not allowed", { status: 405 });
		}

		const payload = await req.json() as Params;
		const instance = await env.LESSON_PLAN_WORKFLOW.create({
			params: payload,
		});

		return Response.json({
			id: instance.id,
			details: await instance.status(),
		});
	},
};
