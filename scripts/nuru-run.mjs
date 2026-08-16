// Scratch harness: runs Nuru source through the real wasm interpreter and
// prints whatever the program wrote, so generated lesson code can be checked
// by execution instead of by eye.
//
// It loads main.wasm directly rather than going through @nuru/wasm, whose
// entry point does `import "./wasm_exec"` with no file extension. Bundlers
// resolve that; raw Node ESM does not.
import { readFile } from "node:fs/promises";
const pkgDir = new URL("../node_modules/@nuru/wasm/", import.meta.url).pathname;

// wasm_exec.js is a classic script that assigns globalThis.Go.
const { default: _ } = await import(`file://${pkgDir}dist/wasm_exec.js`);

const code = await new Promise((resolve) => {
	let buf = "";
	process.stdin.on("data", (d) => (buf += d));
	process.stdin.on("end", () => resolve(buf));
});

const chunks = [];
let sawError = false;

globalThis.nuruOutputReceiver = (out, isError = false) => {
	chunks.push(out);
	if (isError) sawError = true;
};

const go = new globalThis.Go();
const wasmBytes = await readFile(`${pkgDir}main.wasm`);
const { instance } = await WebAssembly.instantiate(wasmBytes.buffer, go.importObject);

go.run(instance);

if (typeof globalThis.runCode !== "function") {
	console.error("runCode was not exported by the wasm module");
	process.exit(2);
}

globalThis.runCode(code);

// Let the interpreter flush before reading output.
await new Promise((r) => setTimeout(r, 300));

process.stdout.write(chunks.join(""));
process.exit(sawError ? 1 : 0);
