import { getCloudflareContext } from "@opennextjs/cloudflare";
import { LessonView } from "@/components/lesson-view";
import { redirect } from "next/navigation";

export const runtime = "edge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LessonPage({ params }: PageProps) {
  const { id } = await params;
  const { env } = await getCloudflareContext({async:true});

  // Fetch lesson
  const lesson = await env.nuru_tutor_db.prepare(
    "SELECT * FROM lessons WHERE id = ?"
  ).bind(id).first();

  if (!lesson) {
    return <div className="p-10 text-white">Lesson not found</div>;
  }

  // Fetch user
  const user = await env.nuru_tutor_db.prepare(
    "SELECT * FROM users WHERE id = ?"
  ).bind(lesson.user_id).first();

  if (!user) {
    // Should not happen if foreign key integrity, but handle anyway
    return <div className="p-10 text-white">User profile not found</div>;
  }

  return (
    <LessonView 
      lesson={{
        id: lesson.id,
        title: lesson.title,
        emphasisLevel: lesson.emphasis_level,
        order: lesson.order
      }}
      userProfile={{
        age: String(user.age),
        language: user.language,
        experienceLevel: user.experience_level,
      }}
    />
  );
}
