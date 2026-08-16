import { eq } from "drizzle-orm";
import { NextResponse, after } from "next/server";

import { db } from "@/lib/db";
import { generationJobs, lessons, users } from "@/lib/db/schema";
import { runGeneration } from "@/lib/generation/run";
import { isUuid } from "@/lib/utils";

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ jobId: string }> },
) {
	const { jobId } = await params;

	if (!isUuid(jobId)) {
		return NextResponse.json({ error: "Job not found" }, { status: 404 });
	}

	const [job] = await db
		.select()
		.from(generationJobs)
		.where(eq(generationJobs.id, jobId))
		.limit(1);

	if (!job) {
		return NextResponse.json({ error: "Job not found" }, { status: 404 });
	}

	if (job.status === "complete") {
		return NextResponse.json(
			{ error: "This plan already generated successfully." },
			{ status: 409 },
		);
	}

	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, job.userId))
		.limit(1);

	if (!user) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	// Clear any partial plan so a retry cannot leave duplicate or half-ordered
	// lessons behind.
	await db.delete(lessons).where(eq(lessons.userId, job.userId));

	const [reset] = await db
		.update(generationJobs)
		.set({
			status: "pending",
			stage: "queued",
			error: null,
			updatedAt: new Date(),
		})
		.where(eq(generationJobs.id, jobId))
		.returning();

	const url = new URL(req.url);
	const langParam = url.searchParams.get("language")?.toLowerCase();
	const targetLanguage =
		langParam === "en" || langParam === "english" ? "English" : "Swahili";

	after(() =>
		runGeneration({
			jobId: reset.id,
			userId: user.id,
			age: String(user.age ?? ""),
			language: user.language ?? "none",
			experienceLevel: user.experienceLevel ?? "beginner",
			targetLanguage,
		}),
	);

	return NextResponse.json({ jobId: reset.id, userId: user.id });
}
