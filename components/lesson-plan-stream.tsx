"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Circle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { GenerationEvent, GenerationStage } from "@/lib/generation/events";
import { cn } from "@/lib/utils";

export interface PlanLesson {
	id: string;
	title: string;
	slug: string;
	emphasisLevel: string;
	order: number;
	completed?: boolean;
}

interface LessonPlanStreamProps {
	jobId: string | null;
	jobStatus: "pending" | "running" | "complete" | "error" | null;
	jobError: string | null;
	jobUpdatedAt: string | null;
	initialLessons: PlanLesson[];
	language?: string;
	isEnglish: boolean;
}

/** A job stuck this long past its last write is treated as dead. */
const STALE_AFTER_MS = 120_000;

const STAGE_COPY: Record<
	GenerationStage,
	{ en: string; sw: string }
> = {
	queued: {
		en: "Getting things ready...",
		sw: "Tunajiandaa...",
	},
	profile: {
		en: "Considering your experience...",
		sw: "Tunaangalia uzoefu wako...",
	},
	syllabus: {
		en: "Drafting your syllabus...",
		sw: "Tunaandaa muhtasari wako...",
	},
	writing: {
		en: "Writing your lessons...",
		sw: "Tunaandika masomo yako...",
	},
	done: {
		en: "Done.",
		sw: "Imekamilika.",
	},
};

export function LessonPlanStream({
	jobId,
	jobStatus,
	jobError,
	jobUpdatedAt,
	initialLessons,
	language,
	isEnglish,
}: LessonPlanStreamProps) {
	const [lessons, setLessons] = useState<PlanLesson[]>(initialLessons);
	const [stage, setStage] = useState<GenerationStage>("queued");
	const [error, setError] = useState<string | null>(jobError);
	const [isDone, setIsDone] = useState(jobStatus === "complete");
	const [isRetrying, setIsRetrying] = useState(false);
	const [isStale, setIsStale] = useState(false);

	const lastEventAt = useRef<number>(
		jobUpdatedAt ? new Date(jobUpdatedAt).getTime() : Date.now(),
	);

	const isActive = Boolean(jobId) && !isDone && !error;

	useEffect(() => {
		if (!jobId || isDone || error) return;

		const source = new EventSource(`/api/generation/${jobId}/stream`);

		source.onmessage = (message) => {
			lastEventAt.current = Date.now();
			setIsStale(false);

			const event = JSON.parse(message.data) as GenerationEvent;

			if (event.type === "stage") {
				setStage(event.stage);
				return;
			}

			if (event.type === "lesson") {
				setLessons((current) => {
					if (current.some((l) => l.id === event.lesson.id)) return current;
					return [...current, event.lesson].sort((a, b) => a.order - b.order);
				});
				return;
			}

			if (event.type === "complete") {
				setIsDone(true);
				source.close();
				return;
			}

			if (event.type === "error") {
				setError(event.message);
				source.close();
			}
		};

		source.onerror = () => {
			// EventSource reconnects on its own; the stream replays from the DB,
			// so a dropped connection heals without losing lessons.
		};

		return () => source.close();
	}, [jobId, isDone, error]);

	// Catches the case the SSE stream cannot: the process died mid-run, so no
	// error event is ever emitted and the job row stays on "running".
	useEffect(() => {
		if (!isActive) return;

		const timer = setInterval(() => {
			if (Date.now() - lastEventAt.current > STALE_AFTER_MS) {
				setIsStale(true);
			}
		}, 5_000);

		return () => clearInterval(timer);
	}, [isActive]);

	const retry = useCallback(async () => {
		if (!jobId) return;

		setIsRetrying(true);
		try {
			const query = language ? `?language=${language}` : "";
			const res = await fetch(`/api/generation/${jobId}/retry${query}`, {
				method: "POST",
			});

			if (!res.ok) {
				const body = (await res.json().catch(() => ({}))) as {
					error?: string;
				};
				setError(body.error ?? "Retry failed.");
				return;
			}

			setLessons([]);
			setStage("queued");
			setError(null);
			setIsStale(false);
			setIsDone(false);
			lastEventAt.current = Date.now();
		} finally {
			setIsRetrying(false);
		}
	}, [jobId, language]);

	const failed = error !== null || isStale;

	if (failed) {
		return (
			<div className="grid gap-4">
				{lessons.map((lesson) => (
					<LessonCard
						key={lesson.id}
						lesson={lesson}
						language={language}
						isEnglish={isEnglish}
					/>
				))}

				<Card className="border-red-900/60 bg-red-950/20">
					<CardHeader className="flex flex-row items-center gap-3 pb-2">
						<AlertTriangle className="h-5 w-5 text-red-400" />
						<CardTitle className="text-base font-semibold text-red-200">
							{isEnglish
								? "Your lesson plan did not finish generating"
								: "Mpango wa masomo haukukamilika"}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-red-300/80">
							{error ??
								(isEnglish
									? "Generation stopped responding. This usually means the server restarted mid-run."
									: "Uzalishaji umesimama. Mara nyingi hii inamaanisha seva imeanza upya.")}
						</p>
						<Button
							onClick={retry}
							disabled={isRetrying}
							className="bg-emerald-600 text-white hover:bg-emerald-700"
						>
							{isRetrying
								? isEnglish
									? "Retrying..."
									: "Tunajaribu tena..."
								: isEnglish
									? "Try again"
									: "Jaribu tena"}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="grid gap-4">
			{lessons.map((lesson) => (
				<LessonCard
					key={lesson.id}
					lesson={lesson}
					language={language}
					isEnglish={isEnglish}
				/>
			))}

			{isActive && lessons.length === 0 && (
				<>
					<div className="flex items-center gap-3 text-sm text-zinc-400">
						<Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
						<span>{isEnglish ? STAGE_COPY[stage].en : STAGE_COPY[stage].sw}</span>
					</div>
					{[...Array(3)].map((_, i) => (
						<Card key={i} className="border-zinc-800 bg-zinc-900">
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<Skeleton className="h-6 w-1/3" />
								<Skeleton className="h-6 w-6 rounded-full" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-5 w-24" />
							</CardContent>
						</Card>
					))}
				</>
			)}

			{isActive && lessons.length > 0 && (
				<div className="flex items-center gap-3 py-2 text-sm text-zinc-400">
					<Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
					<span>{isEnglish ? STAGE_COPY[stage].en : STAGE_COPY[stage].sw}</span>
				</div>
			)}
		</div>
	);
}

function LessonCard({
	lesson,
	language,
	isEnglish,
}: {
	lesson: PlanLesson;
	language?: string;
	isEnglish: boolean;
}) {
	return (
		<Link
			href={`/lesson/${lesson.id}${language ? `?language=${language}` : ""}`}
			className="animate-in fade-in slide-in-from-bottom-2 duration-300"
		>
			<Card
				className={cn(
					"border-zinc-800 bg-zinc-900 transition-colors hover:border-emerald-500/50",
					lesson.completed && "border-emerald-900/50 bg-emerald-950/10",
				)}
			>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-xl font-semibold text-zinc-100">
						{lesson.title}
					</CardTitle>
					{lesson.completed ? (
						<CheckCircle2 className="h-6 w-6 text-emerald-500" />
					) : (
						<Circle className="h-6 w-6 text-zinc-600" />
					)}
				</CardHeader>
				<CardContent>
					<div className="flex gap-2 text-sm text-zinc-400">
						<span className="rounded bg-zinc-800 px-2 py-1 text-xs tracking-wider uppercase">
							{lesson.emphasisLevel} {isEnglish ? "Emphasis" : "Msisitizo"}
						</span>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
