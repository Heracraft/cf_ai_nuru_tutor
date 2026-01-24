import { google } from "@ai-sdk/google";
import { streamText, Output, generateText } from "ai";
import { helpResponseSchema } from "@/lib/validation";
import { NURU_DOCS } from "../chat/route";

interface HelpRequestBody {
    code: string;
    output: string;
    language?: string;
    lessonContext?: {
        title: string;
        emphasisLevel: string;
    };
}

export async function POST(req: Request) {
    const body = (await req.json()) as HelpRequestBody;
    const { code, output, lessonContext, language = "Swahili" } = body;

    const selectedModel = google("gemini-3-flash-preview"); 

    const systemPrompt = `
You are a helpful AI tutor for the Nuru programming language (Swahili-based).
Your goal is to help a student who is stuck or needs assistance.
You will be provided with the current code they wrote and the output/error log they received.

Context:
Lesson: ${lessonContext?.title || "Unknown"}
Emphasis: ${lessonContext?.emphasisLevel || "Normal"}

Instructions:
1. Analyze the code and the output.
2. Identify errors or missing concepts based on the Nuru language specification.
3. Provide the SAME code back, but inject COMMENTS (using //) to explain the error or give a hint.
4. Do NOT solve the problem entirely if it's a simple syntax error; guide them.
5. If the code is correct but they want next steps, suggest an improvement.
6. The explanations should be in ${language} (unless requested otherwise, but default is ${language}).
7. Return the result as a structured object: { code: string, explanation: string }.


Reference Nuru Specs:
${NURU_DOCS}
  `;

    const userContent = `
Code:
${code}

Output/Logs:
${output}
  `;

    const {output:result} =await generateText({
        model: selectedModel,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
        ],
        output: Output.object({
            schema: helpResponseSchema,
        }),
    });

    return Response.json(result);
}
