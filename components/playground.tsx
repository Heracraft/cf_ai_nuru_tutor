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

import { PlaygroundProps, LanguageExecutor, logEntry } from "@/types";

export function Playground({ initialCode }: PlaygroundProps) {
	const [code, setCode] = useState(initialCode);
	const [logs, setLogs] = useState<logEntry[]>([]);

	const [nuru, isNuruInitializing] = useNuru((content, isError) => {
		setLogs((logs) => [...logs, { content, isError }]);
	});

	const nuruExecutor: LanguageExecutor = {
		language: "Nuru",
		run: async (code) => {
			// return await executeNuru(code);
			console.log(code);
			return "we rannn";
		},
		submit: async (code) => {
			try {
				// await executeNuru(code);

				return { status: 200 };
			} catch (e) {
				return { status: 400 };
			}
		},
		getSolution: () => "za solution",
	};

	return (
		<div className="flex items-start gap-2">
			<ResizablePanelGroup
				direction="horizontal"
				className="h-60 max-h-60 min-h-60 max-w-3xl flex-1 rounded border bg-zinc-900 md:min-w-112.5"
			>
				<ResizablePanel defaultSize={65} className="">
					<CodeEditor onChange={setCode} code={code} />
				</ResizablePanel>
				<ResizableHandle withHandle />
				<ResizablePanel defaultSize={35} className="flex flex-col">
					<div className="flex flex-1 flex-col overflow-y-auto px-2 py-1 scrollbar scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
						{logs.length == 0 ? (
							<p className="text-muted-foreground text-base italic">
								&gt;
								Matokeo yatatokea hapa
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
				<Button
					disabled={isNuruInitializing}
					onClick={() => {
						nuru?.execute(code);
					}}
					size={"icon"}
				>
					<PlayIcon className="text-primary-foreground" />
				</Button>
				<Button disabled variant={"outline"} size={"icon"}>
					<SparkleIcon className="text-foreground" />
				</Button>
			</ButtonGroup>
		</div>
	);
}
