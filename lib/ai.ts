import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/**
 * Three call profiles.
 *
 * "chat" streams a structured lesson object that the client parses
 * incrementally, so a schema slip blanks the screen.
 *
 * "plan" runs once per student and produces the course spine, which is also
 * the first thing they read. Nano-tier writes visibly broken Swahili here
 * (shouty casing, invented words), so this one is worth the better model. It
 * is a single call per user, so the cost difference is a fraction of a cent.
 *
 * "help" fires on demand while a student is stuck: frequent, small, and cheap
 * to retry, so it takes the smallest model.
 */
export type ModelRole = "chat" | "plan" | "help";

export type Provider = "openai" | "google";

/**
 * Reads an env var, treating blank as absent.
 *
 * Container platforms inject declared-but-unset variables as empty strings, so
 * ?? would happily accept "" and skip the fallback.
 */
function env(name: string): string | undefined {
	return process.env[name]?.trim() || undefined;
}

// The AI SDK reads OPENAI_API_KEY. Accept the underscored spelling too,
// since that is easy to write and silently wrong otherwise.
const openaiApiKey = env("OPENAI_API_KEY") || env("OPEN_AI_API_KEY");

const googleApiKey =
	env("GOOGLE_GENERATIVE_AI_API_KEY") || env("GEMINI_API_KEY");

// Passed explicitly rather than left to the SDK's own env lookup, which would
// otherwise pick up an empty OPENAI_BASE_URL and build a relative "/responses".
const openaiBaseUrl = env("OPENAI_BASE_URL") ?? "https://api.openai.com/v1";

function resolveProvider(): Provider {
	const explicit = env("AI_PROVIDER")?.toLowerCase();

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

let cachedProvider: Provider | null = null;

export function getProvider(): Provider {
	cachedProvider ??= resolveProvider();
	return cachedProvider;
}

// Resolved eagerly so a misconfigured container fails on boot rather than on a
// student's first click. Skipped during next build, which imports every route
// module and has no reason to hold real credentials.
if (process.env.NEXT_PHASE !== "phase-production-build") {
	getProvider();
}

const DEFAULT_MODELS: Record<Provider, Record<ModelRole, string>> = {
	openai: {
		chat: "gpt-5-mini",
		plan: "gpt-5-mini",
		help: "gpt-5-nano",
	},
	google: {
		chat: "gemini-2.5-flash",
		plan: "gemini-2.5-flash",
		help: "gemini-2.5-flash",
	},
};

const MODEL_ENV_VAR: Record<ModelRole, string> = {
	chat: "AI_MODEL_CHAT",
	plan: "AI_MODEL_PLAN",
	help: "AI_MODEL_HELP",
};

function modelId(role: ModelRole): string {
	// AI_MODEL_UTILITY is the older name for the two non-chat roles.
	const override = env(MODEL_ENV_VAR[role]) || env("AI_MODEL_UTILITY");
	return override || DEFAULT_MODELS[getProvider()][role];
}

const openai = openaiApiKey
	? createOpenAI({
			apiKey: openaiApiKey,
			// Lets the same code target OpenRouter, Groq, a local vLLM, or anything
			// else speaking the OpenAI wire format.
			baseURL: openaiBaseUrl,
		})
	: null;

const google = googleApiKey
	? createGoogleGenerativeAI({ apiKey: googleApiKey })
	: null;

export function getModel(role: ModelRole): LanguageModel {
	const id = modelId(role);

	if (getProvider() === "openai") {
		if (!openai)
			throw new Error("OpenAI provider selected but not configured.");
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
	if (getProvider() !== "openai") return undefined;

	// Writing natural Swahili needs more than "minimal"; the help route only
	// annotates existing code, so it does not.
	return {
		openai: {
			reasoningEffort: role === "help" ? "minimal" : "low",
		},
	} as const;
}

/** Describes the active configuration, for logs and the health endpoint. */
export function describeAiConfig() {
	return {
		provider: getProvider(),
		chatModel: modelId("chat"),
		planModel: modelId("plan"),
		helpModel: modelId("help"),
		baseUrl: openaiBaseUrl,
	};
}
