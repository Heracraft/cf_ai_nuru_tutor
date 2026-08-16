import { NextResponse, after, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { generationJobs, users } from "@/lib/db/schema";
import { runGeneration } from "@/lib/generation/run";

interface OnboardingBody {
	age?: string;
	language?: string;
	experienceLevel?: string;
	targetLanguage?: string;
}

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as OnboardingBody;

		const age = body.age?.trim();
		const experienceLevel = body.experienceLevel?.trim();

		if (!age || !experienceLevel) {
			return NextResponse.json(
				{ error: "age and experienceLevel are required" },
				{ status: 400 },
			);
		}

		const parsedAge = Number.parseInt(age, 10);

		const [user] = await db
			.insert(users)
			.values({
				age: Number.isNaN(parsedAge) ? null : parsedAge,
				language: body.language?.trim() || "none",
				experienceLevel,
			})
			.returning();

		const [job] = await db
			.insert(generationJobs)
			.values({ userId: user.id, status: "pending", stage: "queued" })
			.returning();

		// Return as soon as the job exists. Generation continues after the
		// response is sent, and the client watches it over SSE.
		after(() =>
			runGeneration({
				jobId: job.id,
				userId: user.id,
				age,
				language: body.language?.trim() || "none",
				experienceLevel,
				targetLanguage: body.targetLanguage || "Swahili",
			}),
		);

		return NextResponse.json({ userId: user.id, jobId: job.id });
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Onboarding failed";
		console.error("Onboarding error", e);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
