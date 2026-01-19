import init, { NuruInstance } from "@nuru/wasm";

import { useState, useEffect } from "react";

import type { OutputReceiver } from "@/types";

export function useNuru(
	outputReceiver: OutputReceiver,
): [NuruInstance, false] | [null, true] {
	const [nuruInstance, setNuruInstance] = useState<NuruInstance | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		if (!nuruInstance) {
			// setIsLoading(true)
			init({
				outputReceiver,
			}).then((nuru) => {
				if (mounted) {
					// check if the component is mounted
					setNuruInstance(nuru);
					setIsLoading(false);
				}
			});
		}

		return () => {
			// cleanup function that sets mounted=false
			mounted = false;
		};
	}, []);

	// why `mounted`? Because initing Nuru (`init`) is an async operation
	// it requires loading a wasm binary and all that
	// init().then()... might execute after the user has navigated away
	// and react will try to update state ('setNuruInstance`) that is no longer available
	// throwing an error.
	// That's why we return a cleanup function that sets mounted=false when useEffect is unmounted

	return [nuruInstance, isLoading] as [NuruInstance, false] | [null, true];
}
