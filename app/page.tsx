"use client";

import { LanguageExecutor } from "@/types";

import { Playground } from "@/components/playground";

export default function Page() {
	return (
		<div className="flex flex-1 flex-col gap-4">
			<p className="text-lg">
				Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque dolor
				eius molestiae neque amet inventore magni qui laborum ex temporibus? Ex
				quis minima deserunt assumenda modi consequuntur dolor, repellendus
				blanditiis!
			</p>
			<Playground
				initialCode="andika('Hi cloudflare team')"
				//  executor={nuruExecutor}
			/>
		</div>
	);
}
