"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

import { Playground } from "@/components/playground";

import { LanguageExecutor } from "@/types";

const responseSchema = z.object({
	lesson: z.string(),
	sampleCode: z.string(),
});

export default function Page() {
	const [messages, setMessages] = useState<any[]>([]);
	const [status, setStatus] = useState("idle");

	const sendMessage = async (input: { text: string }) => {
		setStatus("loading");
		const newHistory = [
			...messages,
			{ role: "user", content: input.text, id: Date.now().toString() },
		];
		setMessages(newHistory);

		try {
			const response = await fetch("/api/lesson", {
				method: "POST",
				body: JSON.stringify({ messages: newHistory }),
				cache: "force-cache", // dev only
			});
			const data = await response.json();
			console.log({data})
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: JSON.stringify(data),
					id: (Date.now() + 1).toString(),
				},
			]);
			setStatus("idle");
		} catch (error) {
			console.error(error);
			setStatus("error");
		}
	};

	useEffect(() => {
		if (messages.length === 0) {
			sendMessage({
				text: "Start lesson",
			});
		}
	}, []);

	return (
		<div className="flex flex-1 flex-col gap-4">
			{messages.length > 0 ? (
				<>
					{messages.map((message, index) => {
						if (message.role === "assistant") {
							try {
								const parsedContent = JSON.parse(message.content) as Array<{
									type: string;
									text: string;
								}>;
								const lessonContent = JSON.parse(parsedContent[0].text) as {
									lesson: string;
									sampleCode: string;
								};
								return (
									<div key={index} className="flex flex-col gap-2">
										<h2 className="text-xl font-bold">
											{lessonContent.lesson}
										</h2>
										<Playground initialCode={lessonContent.sampleCode} />
									</div>
								);
							} catch (e) {
								console.error("Failed to parse assistant message", e);
								return <div key={index}>Error parsing message</div>;
							}
						}
						return <div key={index}>{message.content}</div>;
					})}
				</>
			) : (
				<p>empty for now</p>
			)}
			<p className="text-lg">
				Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque dolor
				eius molestiae neque amet inventore magni qui laborum ex temporibus? Ex
				quis minima deserunt assumenda modi consequuntur dolor, repellendus
				blanditiis!
			</p>
			<Playground
				initialCode="andika('Hi cloudflare team')"
				//  executor={nuruExecutor}
			/>
		</div>
	);
}
