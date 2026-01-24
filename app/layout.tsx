import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans } from "next/font/google";

import { cn } from "@/lib/utils";

import "./globals.css";

const notoSans = Noto_Sans({ variable: "--font-sans" });

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Nuru tutor",
	description: "Nuru tutor is a language learning platform that teaches programming in Swahili.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={cn(
					notoSans.variable,
					"dark flex flex-col h-dvh items-center antialiased",
				)}
			>
				<main className="flex flex-col flex-1 w-full">
					{children}
				</main>
			</body>
		</html>
	);
}
