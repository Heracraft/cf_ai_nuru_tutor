import React from "react";

export interface LanguageExecutor {
	language: string;
	run: (code: string) => Promise<string>;
	submit: (code: string) => Promise<{ status: number }>;
	getSolution: () => string;
	// Callback before execution starts (for resetting components, etc.)
	onBeforeRun?: () => void;
}

export interface PlaygroundProps {
	initialCode: string;
	executor: LanguageExecutor;
}
