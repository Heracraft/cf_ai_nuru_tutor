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

/**
 * One entry in a generated lesson plan. Kept as a standalone element schema so
 * plan generation can stream with Output.array and hand back finished lessons
 * one at a time instead of a single blob at the end.
 */
export const lessonPlanItemSchema = z.object({
  title: z.string().describe("Lesson title, in the learner's target language."),
  slug: z
    .string()
    .describe("Lowercase ASCII kebab-case identifier, e.g. maoni-na-vitambulisho."),
  emphasisLevel: z
    .enum(["low", "medium", "high"])
    .describe("How much drilling this learner needs on the concept, given their experience."),
});

export type LessonPlanItem = z.infer<typeof lessonPlanItemSchema>;

export const lessonPlanSchema = z.array(lessonPlanItemSchema);

export type LessonPlan = z.infer<typeof lessonPlanSchema>;

/** Number of lessons a generated plan contains. */
export const LESSON_PLAN_SIZE = 5;

export const helpResponseSchema = z.object({
  code: z.string().describe("The code with added comments explaining the solution or providing hints."),
  explanation: z.string().describe("A brief explanation of what was changed or a hint."),
});

export type HelpResponse = z.infer<typeof helpResponseSchema>;