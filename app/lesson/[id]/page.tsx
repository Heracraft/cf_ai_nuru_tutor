import { eq } from "drizzle-orm";

import { LessonView } from "@/components/lesson-view";
import { db } from "@/lib/db";
import { lessons, users } from "@/lib/db/schema";
import { isUuid } from "@/lib/utils";

interface PageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LessonPage({ params, searchParams }: PageProps) {
	const { id } = await params;
	const { language: langParam } = await searchParams;

	if (!isUuid(id)) {
		return <div className="p-10 text-white">Lesson not found</div>;
	}

	const [lesson] = await db
		.select()
		.from(lessons)
		.where(eq(lessons.id, id))
		.limit(1);

	if (!lesson) {
		return <div className="p-10 text-white">Lesson not found</div>;
	}

	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, lesson.userId))
		.limit(1);

	if (!user) {
		// Should not happen given the foreign key, but handle anyway.
		return <div className="p-10 text-white">User profile not found</div>;
	}

	const languageOverride =
		typeof langParam === "string" &&
		(langParam.toLowerCase() === "en" || langParam.toLowerCase() === "english")
			? "English"
			: (user.language ?? "Swahili");

	return (
		<LessonView
			lesson={{
				id: lesson.id,
				title: lesson.title,
				emphasisLevel: lesson.emphasisLevel ?? "medium",
				order: lesson.order,
			}}
			userProfile={{
				age: String(user.age ?? ""),
				language: languageOverride,
				experienceLevel: user.experienceLevel ?? "beginner",
			}}
		/>
	);
}
