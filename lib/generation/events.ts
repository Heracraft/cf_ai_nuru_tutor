import { EventEmitter } from "node:events";

/** Progress markers shown before the first lesson card lands. */
export type GenerationStage =
	| "queued"
	| "profile"
	| "syllabus"
	| "writing"
	| "done";

export type GenerationEvent =
	| { type: "stage"; stage: GenerationStage }
	| {
			type: "lesson";
			lesson: {
				id: string;
				title: string;
				slug: string;
				emphasisLevel: string;
				order: number;
			};
	  }
	| { type: "complete"; count: number }
	| { type: "error"; message: string };

/**
 * Generation runs in the same process as the SSE route via after(), so a
 * module-level emitter is enough to get updates from one to the other.
 *
 * This is the piece that assumes a single instance. Running two replicas would
 * leave a client subscribed to the wrong process, and the fix then is Postgres
 * LISTEN/NOTIFY. See TODO.md.
 */
const globalForBus = globalThis as unknown as {
	nuruGenerationBus?: EventEmitter;
};

const bus =
	globalForBus.nuruGenerationBus ??
	(() => {
		const created = new EventEmitter();
		// Many students can watch their own job at once; the default of 10 is low.
		created.setMaxListeners(0);
		return created;
	})();

globalForBus.nuruGenerationBus = bus;

export function publish(jobId: string, event: GenerationEvent) {
	bus.emit(jobId, event);
}

export function subscribe(
	jobId: string,
	listener: (event: GenerationEvent) => void,
) {
	bus.on(jobId, listener);
	return () => {
		bus.off(jobId, listener);
	};
}
