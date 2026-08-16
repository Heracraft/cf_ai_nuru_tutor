import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error(
		"DATABASE_URL is not set. Point it at your Postgres instance, e.g. postgres://nuru:nuru@localhost:5432/nuru_tutor",
	);
}

// Next's dev server re-evaluates modules on each change, which would otherwise
// open a new pool every time. Stash the client on globalThis to survive reloads.
const globalForDb = globalThis as unknown as {
	nuruDbClient?: ReturnType<typeof postgres>;
};

const client =
	globalForDb.nuruDbClient ?? postgres(connectionString, { max: 10 });

if (process.env.NODE_ENV !== "production") {
	globalForDb.nuruDbClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
