import { z } from "zod";

export const lessonResponseSchema = z.object({
	lesson: z.string(),
	lessonContent: z.string(),
	// sampleCode: z.string(),
	nextLesson: z.string(),
  exercise: z.object({
    initialCode: z.string(),
    targetOutput: z.string(),
  }),
  order: z.number(),
  isStartOfNewLesson: z.boolean(),
});

export type Lesson = z.infer<typeof lessonResponseSchema>

export const lessonPlanSchema = z.array(
  z.object({
    title: z.string(),
    slug: z.string(),
    emphasisLevel: z.enum(["low", "medium", "high"]),
  })
);

export type LessonPlan = z.infer<typeof lessonPlanSchema>;