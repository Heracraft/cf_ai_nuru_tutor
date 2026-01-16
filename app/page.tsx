"use client";

import { LanguageExecutor } from "@/types";

import { Playground } from "@/components/playground";

const nuruExecutor: LanguageExecutor = {
	language: "Nuru",
	run: async (code) => {
		// return await executeNuru(code);
		console.log(code);
		return "we rannn";
	},
	submit: async (code) => {
		try {
			// await executeNuru(code);

			return { status: 200 };
		} catch (e) {
			return { status: 400 };
		}
	},
	getSolution: () => "za solution",
};

export default function Page() {
	return (
		<div className="flex flex-col flex-1 gap-4">
			<p className="text-lg ">Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque dolor eius molestiae neque amet inventore magni qui laborum ex temporibus? Ex quis minima deserunt assumenda modi consequuntur dolor, repellendus blanditiis!</p>
			<Playground initialCode="andika(bs0" executor={nuruExecutor} />
		</div>
	);
}
