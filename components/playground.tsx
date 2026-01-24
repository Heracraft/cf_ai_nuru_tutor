"use client";

import { useState } from "react";

import { useNuru } from "@/hooks/useNuru";

import { CodeEditor } from "@/components/codeEditor";

import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
	ButtonGroup,
	ButtonGroupSeparator,
	ButtonGroupText,
} from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";

import { TerminalIcon, PlayIcon, SparkleIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { PlaygroundProps, LanguageExecutor, logEntry } from "@/types";

import { useRef, useEffect } from "react";
import { HelpResponse } from "@/lib/validation";

export function Playground({
	initialCode,
	targetOutput,
	className,
	onRun,
	lessonContext,
	language,
}: PlaygroundProps) {
	const [code, setCode] = useState(initialCode);
	const [logs, setLogs] = useState<logEntry[]>([]);
	const currentRunLogs = useRef<string[]>([]);

	const [nuru, isNuruInitializing] = useNuru((content, isError) => {
		setLogs((logs) => [...logs, { content, isError }]);
		currentRunLogs.current.push(content);
	});

	const [isHelpLoading, setIsHelpLoading] = useState(false);

	const handleHelp = async () => {
		setIsHelpLoading(true);
		const res = await fetch("/api/help", {
			method: "POST",
			body: JSON.stringify({
				code,
				output: logs.map((l) => l.content).join("\n"),
				lessonContext,
				language,
			}),
		});

		const data = (await res.json()) as HelpResponse;

		setCode(data.code);
		// setLogs((prev) => [...prev, { content: data.explanation, isError: false }]);
		setIsHelpLoading(false);
	};

	const handleRun = async () => {
		if (!nuru) return;
		setLogs([]);
		currentRunLogs.current = [];

		try {
			nuru.execute(code);
			// Wait a tick for logs to settle if sync, or if async execute resolves when done.
			// Assuming execute resolves when execution finishes.
			if (onRun) {
				onRun(code, currentRunLogs.current.join("\n"));
			}
		} catch (e) {
			console.error(e);
		}
	};

	return (
		<div className={cn("flex items-start gap-2", className)}>
			<ResizablePanelGroup
				direction="horizontal"
				className="h-60 max-h-60 min-h-60 max-w-3xl flex-1 rounded border bg-zinc-900 md:min-w-112.5"
			>
				<ResizablePanel defaultSize={65} className="">
					<CodeEditor onChange={setCode} code={code} />
				</ResizablePanel>
				<ResizableHandle withHandle />
				<ResizablePanel defaultSize={35} className="flex flex-col">
					<div className="scrollbar scrollbar-thumb-zinc-600 scrollbar-track-zinc-800 flex flex-1 flex-col overflow-y-auto px-2 py-1">
						{logs.length == 0 ? (
							<p className="text-muted-foreground text-base italic">
								&gt; Matokeo yatatokea hapa
							</p>
						) : (
							<>
								{logs.map((log, index) => (
									<span
										key={index}
										className={`${log.isError ? "text-destructive" : ""}`}
									>
										{log.content}
									</span>
								))}
							</>
						)}
					</div>
					<div className="s bg-primary flex w-full items-center gap-2 px-2 py-0.5">
						<TerminalIcon size={12} />
						<p className="text-xs">Terminali</p>
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>

			<ButtonGroup orientation={"vertical"} className="dark:bg-zinc-900/">
				<Button disabled={isNuruInitializing} onClick={handleRun} size={"icon"}>
					<PlayIcon className="text-primary-foreground" />
				</Button>
				<Button
					disabled={isHelpLoading}
					variant={"outline"}
					size={"icon"}
					onClick={handleHelp}
				>
					<SparkleIcon
						className={cn(
							"text-foreground",
							isHelpLoading && "animate-pulse text-yellow-500",
						)}
					/>
				</Button>
			</ButtonGroup>
		</div>
	);
}
