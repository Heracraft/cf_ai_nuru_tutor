"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

import { useChat } from "@ai-sdk/react";
import Markdown from "react-markdown";
import { parse } from "best-effort-json-parser";

import { Playground } from "@/components/playground";
import { CodeEditor } from "@/components/codeEditor";

import { Button } from "@/components/ui/button";

import { Lesson } from "@/lib/validation";

import { LanguageExecutor } from "@/types";

const responseSchema = z.object({
	lesson: z.string(),
	sampleCode: z.string(),
});

export default function Page() {
	// const [lessons, setLessons] = useState(0);

	const { messages, sendMessage } = useChat();
	const [currentLessonIndex, setCurrentLessonIndex] = useState(1);

	useEffect(() => {
		if (messages.length === 0) {
			sendMessage({
				text: "Start lesson",
			});
		}
	}, []);

	// useEffect(() => {
	// 	const updatedLessons=messages.map((message) => {
	// 		if (message.role != "user") {
	// 			return message;
	// 		}
	// 	});

	// 	setLessons(updatedLessons)
	// }, [messages]);

	return (
		<div className="min-h-full flex flex-1 flex-col gap-4 border border-dashed bg-zinc-900 p-10	">
			{messages.length > 0 ? (
				<div className="flex-1 flex flex-col">
					{messages.map((message, index) => {
						if (message.role != "user" && currentLessonIndex == index) {
							return (
								<div key={message.id} className="whitespace-pre-wrap">
									{message.parts.map((part, i) => {
										switch (part.type) {
											case "text":
												const content =
													(parse(part.text) as Partial<Lesson>) || "";
												console.log(content);
												return (
													<div
														key={`${message.id}-${i}`}
														className="prose-zinc prose-p:my-0 prose-li:my-0 prose-headings:mb-0 prose-headings:mt-0 dark:prose-invert prose-base"
													>
														{content.lessonContent && (
															<Markdown
																components={{
																	code(props) {
																		const {
																			children,
																			className,
																			node,
																			...rest
																		} = props;
																		const match = /language-(\w+)/.exec(
																			className || "",
																		);
																		return match ? (
																			<div className="not-prose my-2 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
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
																				className="rounded-md bg-zinc-200 px-1.5 py-0.5 font-mono text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
																				{...rest}
																			>
																				{children}
																			</code>
																		);
																	},
																	pre(props) {
																		return (
																			<div className="not-prose">
																				{props.children}
																			</div>
																		);
																	},
																}}
															>
																{content.lessonContent}
															</Markdown>
														)}
													</div>
												);
										}
									})}
								</div>
							);
						}
					})}
				</div>
			) : (
				<p>empty for now</p>
			)}

			{/* <Playground
				initialCode="andika('Hi cloudflare team')"
				//  executor={nuruExecutor}
			/> */}

			<div className="flex justify-end gap-4">
				<Button
					size={"lg"}
					variant={"outline"}
					disabled={currentLessonIndex == 1}
					onClick={() => {
						setCurrentLessonIndex((oldIndex) => (oldIndex -= 2));
					}}
				>
					Previous Lesson
				</Button>
				<Button
					size={"lg"}
					className="text-white"
					onClick={() => {
						sendMessage({
							text: "next lesson please",
						});
						setCurrentLessonIndex((oldIndex) => (oldIndex += 2));
					}}
				>
					Next lesson
				</Button>
			</div>
		</div>
	);
}
