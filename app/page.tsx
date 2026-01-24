"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

function OnboardingContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		age: "",
		language: "",
		experienceLevel: "",
	});

	const isEnglish =
		searchParams.get("language")?.toLowerCase() === "en" ||
		searchParams.get("language")?.toLowerCase() === "english";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const response = await fetch("/api/onboarding", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...formData,
					targetLanguage: isEnglish ? "English" : "Swahili",
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to start journey");
			}

			const data = (await response.json()) as { userId: string };

			if (data.userId) {
				localStorage.setItem("nuru_userId", data.userId);
				const langParam = searchParams.get("language");
				const query = langParam ? `&language=${langParam}` : "";
				router.push(`/dashboard?userId=${data.userId}${query}`);
			}
		} catch (error) {
			console.error("Error:", error);
			// Ideally show toast error here
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-1 items-center justify-center bg-zinc-950 p-4">
			<Card className="max-w-md flex-1 border-zinc-800 bg-zinc-900 text-zinc-100">
				<CardHeader>
					<CardTitle className="text-2xl font-bold text-emerald-500">
						{isEnglish ? "Welcome to Nuru Tutor" : "Karibu Nuru Tutor"}
					</CardTitle>
					<CardDescription className="text-zinc-400">
						{isEnglish
							? "To personalize your learning path, tell us a bit about yourself."
							: "To personalize your learning path, tell us a bit about yourself."}
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="age">{isEnglish ? "Age" : "Umri"}</Label>
							<Input
								id="age"
								type="number"
								placeholder="e.g. 15"
								required
								className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500"
								value={formData.age}
								onChange={(e) =>
									setFormData({ ...formData, age: e.target.value })
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="language">
								{isEnglish ? "Previous Languages" : "Lugha ulizotumia kabla"}
							</Label>
							<Input
								id="language"
								placeholder="e.g. Python, JavaScript, None"
								required
								className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500"
								value={formData.language}
								onChange={(e) =>
									setFormData({ ...formData, language: e.target.value })
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="experience">
								{isEnglish ? "Experience" : "Uzoefu"}
							</Label>
							<Select
								value={formData.experienceLevel}
								onValueChange={(value) =>
									setFormData({ ...formData, experienceLevel: value })
								}
								required
							>
								<SelectTrigger className="border-zinc-700 bg-zinc-800 text-zinc-100">
									<SelectValue placeholder="Select your level" />
								</SelectTrigger>
								<SelectContent className="border-zinc-700 bg-zinc-800 text-zinc-100">
									<SelectItem value="beginner">Beginner</SelectItem>
									<SelectItem value="intermediate">Intermediate</SelectItem>
									<SelectItem value="advanced">Advanced</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
					<CardFooter>
						<Button
							type="submit"
							className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
							disabled={isLoading}
						>
							{isLoading ? "Generating Plan..." : "Start Learning Path"}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}

export default function OnboardingPage() {
	return (
		<Suspense
			fallback={
				<div className="flex flex-1 items-center justify-center bg-zinc-950 p-4 text-white">
					Loading...
				</div>
			}
		>
			<OnboardingContent />
		</Suspense>
	);
}
