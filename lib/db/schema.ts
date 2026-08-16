import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	age: integer("age"),
	language: text("language"),
	experienceLevel: text("experience_level"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const lessons = pgTable(
	"lessons",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		slug: text("slug").notNull(),
		emphasisLevel: text("emphasis_level"),
		// Populated the first time the lesson is generated, then served from
		// here so revisiting a lesson is free and shows the same lesson.
		content: text("content"),
		completed: boolean("completed").notNull().default(false),
		order: integer("order").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [index("idx_lessons_user_id").on(table.userId)],
);

/**
 * Tracks a lesson-plan generation run. The work happens in-process via
 * after(), so this row is the only durable record that a run is underway,
 * and it is what the SSE endpoint replays to a client that connects late
 * or reconnects.
 */
export const generationJobs = pgTable(
	"generation_jobs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		status: text("status", {
			enum: ["pending", "running", "complete", "error"],
		})
			.notNull()
			.default("pending"),
		// Human-readable progress marker shown before the first lesson lands.
		stage: text("stage"),
		error: text("error"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [index("idx_generation_jobs_user_id").on(table.userId)],
);

export type User = typeof users.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type GenerationJob = typeof generationJobs.$inferSelect;
