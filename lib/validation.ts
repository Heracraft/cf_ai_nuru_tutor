import { z } from "zod";

export const lessonResponseSchema = z.object({
	lesson: z.string(),
	lessonContent: z.string(),
	sampleCode: z.string(),
	nextLesson: z.string()
});

export type Lesson = z.infer<typeof lessonResponseSchema>