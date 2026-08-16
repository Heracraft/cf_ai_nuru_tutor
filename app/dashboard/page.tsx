import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lessons as lessonsTable } from "@/lib/db/schema";
import { DashboardRedirector } from "@/components/dashboard-redirector";
import { PagePoller } from "@/components/page-poller";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

export default async function DashboardPage(props: {
	searchParams: Promise<{ userId?: string; language?: string }>;
}) {
	const searchParams = await props.searchParams;
	const { userId, language } = searchParams;

	if (!userId) {
		return <DashboardRedirector />;
	}

	const lessons = await db
		.select()
		.from(lessonsTable)
		.where(eq(lessonsTable.userId, userId))
		.orderBy(asc(lessonsTable.order));

	return (
		<div className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
			<div className="mx-auto max-w-4xl space-y-8">
				<header>
					<h1 className="text-3xl font-bold text-emerald-500">
						Your Learning Path
					</h1>
					<p className="text-zinc-400">
						Track your progress and continue learning.
					</p>
				</header>

				{lessons.length === 0 ? (
					<div className="grid gap-4">
						{[...Array(3)].map((_, i) => (
							<Card key={i} className="border-zinc-800 bg-zinc-900">
								<CardHeader className="flex flex-row items-center justify-between pb-2">
									<Skeleton className="h-6 w-1/3" />
									<Skeleton className="h-6 w-6 rounded-full" />
								</CardHeader>
								<CardContent>
									<div className="flex gap-2">
										<Skeleton className="h-5 w-24" />
									</div>
								</CardContent>
							</Card>
						))}
						<div className="hidden">
							<PagePoller />
						</div>
						<p className="mt-4 animate-pulse text-center text-sm text-zinc-500">
							Generating your personalized lesson plan...
						</p>
					</div>
				) : (
					<div className="grid gap-4">
						{lessons.map((lesson) => (
							<Link
								key={lesson.id}
								href={`/lesson/${lesson.id}${language ? `?language=${language}` : ""}`}
							>
								<Card
									className={`border-zinc-800 bg-zinc-900 transition-colors hover:border-emerald-500/50 ${lesson.completed ? "border-emerald-900/50 bg-emerald-950/10" : ""}`}
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
												{lesson.emphasisLevel} Emphasis
											</span>
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
