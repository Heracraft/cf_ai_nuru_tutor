"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function OnboardingPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		age: "",
		language: "",
		experienceLevel: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const response = await fetch("/api/onboarding", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				throw new Error("Failed to start journey");
			}

			const data = await response.json() as { userId: string };
			
      if (data.userId) {
        localStorage.setItem("nuru_userId", data.userId);
        router.push(`/dashboard?userId=${data.userId}`);
      }
		} catch (error) {
			console.error("Error:", error);
			// Ideally show toast error here
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex-1 flex items-center justify-center bg-zinc-950 p-4">
			<Card className="flex-1 max-w-md border-zinc-800 bg-zinc-900 text-zinc-100">
				<CardHeader>
					<CardTitle className="text-2xl font-bold text-emerald-500">
						Karibu Nuru Tutor
					</CardTitle>
					<CardDescription className="text-zinc-400">
						To personalize your learning path, tell us a bit about yourself.
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="age">Umri</Label>
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
							<Label htmlFor="language">Lugha ulizotumia kabla</Label>
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
							<Label htmlFor="experience">Uzoefu</Label>
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
							className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
