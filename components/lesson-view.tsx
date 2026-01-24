"use client";

import { useEffect, useState } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import Markdown from "react-markdown";
import { parse } from "best-effort-json-parser";

import { CodeEditor } from "@/components/codeEditor";
import { Button } from "@/components/ui/button";
import { Lesson } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Playground } from "./playground";

interface LessonViewProps {
	lesson: {
		id: string;
		title: string;
		emphasisLevel: string;
		order: number;
	};
	userProfile: {
		age: string;
		language: string;
		experienceLevel: string;
	};
}

export function LessonView({ lesson, userProfile }: LessonViewProps) {
	const router = useRouter();
	const { messages, sendMessage } = useChat({
		transport: new DefaultChatTransport({
			body: {
				lessonContext: {
					title: lesson.title,
					emphasisLevel: lesson.emphasisLevel,
				},
				userProfile: userProfile,
			},
		}),
		async onToolCall({ toolCall }) {
			console.log(toolCall);
		},
	});

	const [hasStarted, setHasStarted] = useState(false);

	useEffect(() => {
		if (!hasStarted && messages.length === 0) {
			setHasStarted(true);
			sendMessage({
				text: `Start teaching me the lesson: ${lesson.title}`,
			});
		}
	}, [hasStarted, messages.length, sendMessage, lesson.title]);

	return (
		<div className="flex h-screen flex-col bg-zinc-950">
			<header className="p-4">
				<Button
					size="icon"
					variant={"outline"}
					onClick={() => router.push("/dashboard")}
					className="rounded-lg"
				>
					<ArrowLeft className="h-4 w-4 text-white" />
				</Button>
			</header>

			<div className="scrollbar scrollbar-thumb-zinc-600 scrollbar-track-zinc-800 flex-1 p-4 sm:p-10">
				{messages.length > 0 ? (
					<div className="mx-auto flex max-w-4xl flex-col gap-6">
						{messages.map((message) => {
							if (message.role !== "user") {
								return (
									<div key={message.id} className="whitespace-pre-wrap">
										{message.parts.map((part, i) => {
											if (part.type === "text") {
												const content =
													(parse(part.text) as Partial<Lesson>) || "";
												return (
													<div
														key={`${message.id}-${i}`}
														className="prose prose-zinc dark:prose-invert prose-p:my-0 prose-li:my-0 prose-headings:my-0 prose-pre:my-0 prose-pre:py-0 max-w-none"
													>
														{content.lessonContent && (
															<>
																{content.isStartOfNewLesson && (
																	<div className="mb-4 flex items-center gap-5">
																		<div className="bg-muted h-px flex-1"></div>
																		<p className="text-lg font-semibold">
																			Lesson {content.order}: {content.lesson}
																		</p>
																		<div className="bg-muted h-px flex-1"></div>
																	</div>
																)}
																<Markdown
																	components={{
																		code(props) {
																			const { children, className, ...rest } =
																				props;
																			const match = /language-(\w+)/.exec(
																				className || "",
																			);
																			return match ? (
																				<div className="not-prose my-4 overflow-hidden rounded-md border border-zinc-700">
																					<CodeEditor
																						code={String(children).replace(
																							/\n$/,
																							"",
																						)}
																						readOnly
																					/>
																				</div>
																			) : (
																				<code
																					className="rounded-md bg-zinc-800 px-1.5 py-0.5 font-mono text-sm text-zinc-200"
																					{...rest}
																				>
																					{children}
																				</code>
																			);
																		},
																	}}
																>
																	{content.lessonContent}
																	</Markdown>
															</>
														)}

														{content.exercise && (
															<Playground
																initialCode={content.exercise.initialCode}
																targetOutput={content.exercise.targetOutput}
																
															/>
														)}
													</div>
												);
											}
											return null;
										})}
									</div>
								);
							}
							return null; // Don't show user "Start teaching..." command usually, or show it as user bubble?
							// The original Page.tsx didn't show user messages in the mapped output for some reason?
							// Line 53 in original: if (message.role != "user" && ...)
							// So it filtered out user messages. I'll stick to that behavior.
						})}
					</div>
				) : (
					<div className="flex h-full items-center justify-center text-zinc-500">
						Initializing lesson...
					</div>
				)}
			</div>

			<div className="border-t border-zinc-800 bg-zinc-900 p-4">
				<div className="mx-auto flex max-w-4xl gap-4">
					{/* Interaction input would go here if we wanted the user to chat back via text, 
                 but existing UI used CodeEditor mainly? 
                 Ah, original page had "sendMessage({ text: 'next lesson' })" via buttons.
                 And a Playground?
                 The user request say "using a form (previous language...)" for ONBOARDING.
                 For LESSON: "Chat interface prompts Gemini...".
                 I should add a text input for the user to reply to the tutor?
                 Original `Page.tsx` didn't have a text input for chat, only buttons "Next/Previous".
                 But for a "Tutor", the user might need to ask questions.
                 I'll add a simple input form.
             */}
					<form
						className="flex flex-1 gap-2"
						onSubmit={(e) => {
							e.preventDefault();
							const form = e.target as HTMLFormElement;
							const input = form.elements.namedItem(
								"message",
							) as HTMLInputElement;
							if (input.value.trim()) {
								sendMessage({ text: input.value });
								input.value = "";
							}
						}}
					>
						<input
							name="message"
							className="flex-1 rounded-md border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
							placeholder="Ask Nuru a question or submit your code..."
						/>
						<Button type="submit">Send</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => sendMessage({ text: "Next step" })}
						>
							Continue
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
