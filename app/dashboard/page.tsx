import { asc, desc, eq } from "drizzle-orm";

import { DashboardRedirector } from "@/components/dashboard-redirector";
import {
	LessonPlanStream,
	type PlanLesson,
} from "@/components/lesson-plan-stream";
import { db } from "@/lib/db";
import { generationJobs, lessons as lessonsTable } from "@/lib/db/schema";
import { isUuid } from "@/lib/utils";

export default async function DashboardPage(props: {
	searchParams: Promise<{ userId?: string; language?: string }>;
}) {
	const { userId, language } = await props.searchParams;

	// userId comes from the query string, so a typo would otherwise reach
	// Postgres as a malformed uuid and throw a 500.
	if (!userId || !isUuid(userId)) {
		return <DashboardRedirector />;
	}

	const isEnglish =
		language?.toLowerCase() === "en" || language?.toLowerCase() === "english";

	const [lessons, [job]] = await Promise.all([
		db
			.select()
			.from(lessonsTable)
			.where(eq(lessonsTable.userId, userId))
			.orderBy(asc(lessonsTable.order)),
		db
			.select()
			.from(generationJobs)
			.where(eq(generationJobs.userId, userId))
			.orderBy(desc(generationJobs.createdAt))
			.limit(1),
	]);

	const initialLessons: PlanLesson[] = lessons.map((lesson) => ({
		id: lesson.id,
		title: lesson.title,
		slug: lesson.slug,
		emphasisLevel: lesson.emphasisLevel ?? "medium",
		order: lesson.order,
		completed: lesson.completed,
	}));

	return (
		<div className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
			<div className="mx-auto max-w-4xl space-y-8">
				<header>
					<h1 className="text-3xl font-bold text-emerald-500">
						{isEnglish ? "Your Learning Path" : "Njia Yako ya Kujifunza"}
					</h1>
					<p className="text-zinc-400">
						{isEnglish
							? "Track your progress and continue learning."
							: "Fuatilia maendeleo yako na endelea kujifunza."}
					</p>
				</header>

				<LessonPlanStream
					jobId={job?.id ?? null}
					jobStatus={job?.status ?? null}
					jobError={job?.error ?? null}
					jobUpdatedAt={job?.updatedAt?.toISOString() ?? null}
					initialLessons={initialLessons}
					language={language}
					isEnglish={isEnglish}
				/>
			</div>
		</div>
	);
}
