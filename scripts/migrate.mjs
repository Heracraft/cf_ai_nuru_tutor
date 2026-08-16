/**
 * Applies pending Drizzle migrations, then exits.
 *
 * Plain .mjs rather than TypeScript so the container can run it with bare
 * node, without carrying tsx or a build step into the runtime image.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	console.error("DATABASE_URL is not set; cannot run migrations.");
	process.exit(1);
}

// max: 1 because migrations must run serially on a single connection.
const client = postgres(connectionString, { max: 1 });

try {
	await migrate(drizzle(client), { migrationsFolder: "./migrations" });
	console.log("Migrations applied.");
} catch (error) {
	console.error("Migration failed:", error);
	process.exit(1);
} finally {
	await client.end();
}
