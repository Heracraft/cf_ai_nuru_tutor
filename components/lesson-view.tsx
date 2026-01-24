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

import { Playground } from "./playground";
import { Skeleton } from "@/components/ui/skeleton";

import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";

import { cn } from "@/lib/utils";

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
														className="prose prose-zinc dark:prose-invert prose-pre:bg-inherit prose-p:my-0 prose-li:my-0 prose-headings:my-0 prose-pre:my-0 prose-pre:py-0 max-w-none"
													>
														{content.lessonContent && (
															<>
																{content.isStartOfNewLesson && (
																	<div
																		className={cn(
																			"mb-4 flex items-center gap-5",
																			content.isStartOfNewLesson &&
																				(content.order ?? 0) > 1 &&
																				"mt-20",
																		)}
																	>
																		<div className="bg-muted h-px flex-1"></div>
																		<p className="text-xl font-semibold">
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
																className="mt-4"
																initialCode={content.exercise.initialCode}
																targetOutput={content.exercise.targetOutput}
																onRun={(code, output) => {
																	sendMessage({
																		text: `Code:\n${code}\n\nOutput:\n${output}`,
																	});
																}}
																lessonContext={{
																	title: lesson.title,
																	emphasisLevel: lesson.emphasisLevel,
																}}
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
					<div className="mx-auto flex max-w-4xl flex-col gap-6">
						<div className="flex flex-col gap-2">
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
							<Skeleton className="h-4 w-5/6" />
						</div>
						<div className="flex flex-col gap-2">
							<Skeleton className="h-32 w-full rounded-lg" />
						</div>
					</div>
				)}
			</div>

			<div className="border-t border-zinc-800 bg-zinc-900 p-4">
				<div className="mx-auto flex max-w-4xl gap-4">
					<InputGroup className="border-zinc-700 bg-zinc-800">
						<InputGroupInput
							name="message"
							placeholder="Uliza swali au omba msaada..."
							className="text-zinc-100 placeholder:text-zinc-500"
							onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
								if (e.key === "Enter") {
									const input = e.currentTarget;
									if (input.value.trim()) {
										sendMessage({ text: input.value });
										input.value = "";
									}
								}
							}}
						/>
						<InputGroupAddon align="inline-end">
							<InputGroupButton
								onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
									const input = e.currentTarget
										.closest("div[data-slot='input-group']")
										?.querySelector("input");
									if (input && input.value.trim()) {
										sendMessage({ text: input.value });
										input.value = "";
									}
								}}
							>
								<Send />
							</InputGroupButton>
						</InputGroupAddon>
					</InputGroup>
					<Button
						onClick={() => sendMessage({ text: "Next lesson please" })}
						className="gap-2"
					>
						Endelea <ArrowRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
