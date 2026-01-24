import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { age, language, experienceLevel } = await req.json() as { age: string, language: string, experienceLevel: string };
    const { env } = await getCloudflareContext({async:true});
    const userId = crypto.randomUUID();

    // Create User
    await env.nuru_tutor_db.prepare(
      "INSERT INTO users (id, age, language, experience_level) VALUES (?, ?, ?, ?)"
    ).bind(userId, parseInt(age), language, experienceLevel).run();

    // Trigger Workflow via Service Binding
    // Service Binding 'fetch' expects a full URL passed, but for Service Bindings the hostname is ignored.
    const workflowResponse = await env.WORKFLOWS_SERVICE.fetch("http://workflows/", {
      method: "POST",
      body: JSON.stringify({ userId, age, language, experienceLevel }),
    });

    if (!workflowResponse.ok) {
      console.error("Workflow trigger failed", await workflowResponse.text());
      return NextResponse.json({ error: "Failed to trigger lesson plan generation" }, { status: 500 });
    }

    const workflowData = await workflowResponse.json() as { id: string };

    return NextResponse.json({ userId, workflowId: workflowData.id });
  } catch (e: any) {
    console.error("Onboarding error", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
