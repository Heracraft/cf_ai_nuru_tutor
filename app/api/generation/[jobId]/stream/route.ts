import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { generationJobs, lessons } from "@/lib/db/schema";
import { isUuid } from "@/lib/utils";
import {
	subscribe,
	type GenerationEvent,
	type GenerationStage,
} from "@/lib/generation/events";

/** Keeps proxies from closing an idle stream. */
const HEARTBEAT_MS = 15_000;

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ jobId: string }> },
) {
	const { jobId } = await params;

	if (!isUuid(jobId)) {
		return new Response("Job not found", { status: 404 });
	}

	const [job] = await db
		.select()
		.from(generationJobs)
		.where(eq(generationJobs.id, jobId))
		.limit(1);

	if (!job) {
		return new Response("Job not found", { status: 404 });
	}

	const encoder = new TextEncoder();

	// Held in the outer scope so both the subscription and cancel() can tear
	// them down, whichever fires first.
	let closed = false;
	let heartbeat: ReturnType<typeof setInterval> | undefined;
	let unsubscribe: (() => void) | undefined;

	const teardown = () => {
		closed = true;
		if (heartbeat) clearInterval(heartbeat);
		unsubscribe?.();
	};

	const stream = new ReadableStream({
		async start(controller) {
			const write = (chunk: string) => {
				if (closed) return;
				try {
					controller.enqueue(encoder.encode(chunk));
				} catch {
					// Client vanished mid-write.
					teardown();
				}
			};

			const send = (event: GenerationEvent) =>
				write(`data: ${JSON.stringify(event)}\n\n`);

			const finish = () => {
				teardown();
				try {
					controller.close();
				} catch {
					// Already closed.
				}
			};

			// Replay current state first, so a client that connects late or
			// reconnects sees everything it missed before live events resume.
			const existing = await db
				.select()
				.from(lessons)
				.where(eq(lessons.userId, job.userId))
				.orderBy(asc(lessons.order));

			send({ type: "stage", stage: (job.stage as GenerationStage) ?? "queued" });

			for (const lesson of existing) {
				send({
					type: "lesson",
					lesson: {
						id: lesson.id,
						title: lesson.title,
						slug: lesson.slug,
						emphasisLevel: lesson.emphasisLevel ?? "medium",
						order: lesson.order,
					},
				});
			}

			// A finished job needs no subscription.
			if (job.status === "complete") {
				send({ type: "complete", count: existing.length });
				finish();
				return;
			}

			if (job.status === "error") {
				send({
					type: "error",
					message: job.error ?? "Lesson plan generation failed.",
				});
				finish();
				return;
			}

			heartbeat = setInterval(() => write(": ping\n\n"), HEARTBEAT_MS);

			unsubscribe = subscribe(jobId, (event) => {
				send(event);
				if (event.type === "complete" || event.type === "error") {
					finish();
				}
			});
		},

		cancel() {
			teardown();
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
			// Stops nginx buffering the stream into uselessness.
			"X-Accel-Buffering": "no",
		},
	});
}
