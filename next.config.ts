import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Traced-dependency output, so the runtime Docker image stays small.
	output: "standalone",
};

export default nextConfig;
