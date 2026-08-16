import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/**
 * Two call profiles.
 *
 * "chat" streams a structured lesson object that the client parses
 * incrementally, so a schema slip blanks the screen. It gets the better
 * model and a little reasoning budget.
 *
 * "utility" covers lesson-plan generation and the help button: small,
 * schema-constrained output where a retry costs almost nothing.
 */
export type ModelRole = "chat" | "utility";

export type Provider = "openai" | "google";

// The AI SDK reads OPENAI_API_KEY. Accept the underscored spelling too,
// since that is easy to write and silently wrong otherwise.
const openaiApiKey =
	process.env.OPENAI_API_KEY ?? process.env.OPEN_AI_API_KEY ?? undefined;

const googleApiKey =
	process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
	process.env.GEMINI_API_KEY ??
	undefined;

function resolveProvider(): Provider {
	const explicit = process.env.AI_PROVIDER?.toLowerCase().trim();

	if (explicit === "openai" || explicit === "google") {
		const key = explicit === "openai" ? openaiApiKey : googleApiKey;
		if (!key) {
			throw new Error(
				`AI_PROVIDER is set to "${explicit}" but its API key is missing. ` +
					`Set ${explicit === "openai" ? "OPENAI_API_KEY" : "GOOGLE_GENERATIVE_AI_API_KEY"}.`,
			);
		}
		return explicit;
	}

	if (explicit) {
		throw new Error(
			`AI_PROVIDER must be "openai" or "google", got "${explicit}".`,
		);
	}

	// OpenAI wins when both keys are present.
	if (openaiApiKey) return "openai";
	if (googleApiKey) return "google";

	throw new Error(
		"No AI provider configured. Set OPENAI_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY to fall back to Gemini.",
	);
}

// Resolved once at module load, so a misconfigured container fails on boot
// rather than on a student's first click.
export const provider: Provider = resolveProvider();

const DEFAULT_MODELS: Record<Provider, Record<ModelRole, string>> = {
	openai: {
		chat: "gpt-5-mini",
		utility: "gpt-5-nano",
	},
	google: {
		chat: "gemini-2.5-flash",
		utility: "gemini-2.5-flash",
	},
};

function modelId(role: ModelRole): string {
	const override =
		role === "chat" ? process.env.AI_MODEL_CHAT : process.env.AI_MODEL_UTILITY;
	return override?.trim() || DEFAULT_MODELS[provider][role];
}

const openai = openaiApiKey
	? createOpenAI({
			apiKey: openaiApiKey,
			// Lets the same code target OpenRouter, Groq, a local vLLM, or anything
			// else speaking the OpenAI wire format.
			baseURL: process.env.OPENAI_BASE_URL || undefined,
		})
	: null;

const google = googleApiKey
	? createGoogleGenerativeAI({ apiKey: googleApiKey })
	: null;

export function getModel(role: ModelRole): LanguageModel {
	const id = modelId(role);

	if (provider === "openai") {
		if (!openai) throw new Error("OpenAI provider selected but not configured.");
		return openai(id);
	}

	if (!google) throw new Error("Google provider selected but not configured.");
	return google(id);
}

/**
 * Provider-specific options for a role. The gpt-5 family reasons by default
 * and bills those tokens at the output rate, which is wasted on
 * schema-constrained work, so keep the budget small.
 */
export function getProviderOptions(role: ModelRole) {
	if (provider !== "openai") return undefined;

	return {
		openai: {
			reasoningEffort: role === "chat" ? "low" : "minimal",
		},
	} as const;
}

/** Describes the active configuration, for logs and the health endpoint. */
export function describeAiConfig() {
	return {
		provider,
		chatModel: modelId("chat"),
		utilityModel: modelId("utility"),
		baseUrl: process.env.OPENAI_BASE_URL || null,
	};
}
