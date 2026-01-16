"use client";

import CodeMirror from "@uiw/react-codemirror";
import { go } from "@codemirror/lang-go";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { createTheme } from "@uiw/codemirror-themes";

interface CodeEditorProps {
	code: string;
	onChange: (code: string) => void;
}

// Custom dark theme matching our design
const playgroundTheme = createTheme({
	theme: "dark",
	settings: {
		background: "transparent",
		backgroundImage: "",
		foreground: "#e2e8f0",
		caret: "#22d3ee",
		selection: "#334155",
		selectionMatch: "#334155",
		lineHighlight: "#1e293b",
		gutterBackground: "transparent",
		gutterForeground: "#475569",
		gutterBorder: "transparent",
	},
	styles: [
		{ tag: tags.keyword, color: "#c084fc" },
		{ tag: tags.string, color: "#fbbf24" },
		{ tag: tags.function(tags.variableName), color: "#22d3ee" },
		{ tag: tags.comment, color: "#64748b", fontStyle: "italic" },
		{ tag: tags.variableName, color: "#e2e8f0" },
		{ tag: tags.typeName, color: "#34d399" },
		{ tag: tags.number, color: "#fb923c" },
		{ tag: tags.operator, color: "#94a3b8" },
		{ tag: tags.bracket, color: "#94a3b8" },
		{ tag: tags.propertyName, color: "#60a5fa" },
	],
});

const editorBaseTheme = EditorView.baseTheme({
	"&": {
		fontFamily: "Fira Code, monospace",
		fontSize: "1rem",
		backgroundColor: "hsl(240 5.9% 10%) !important", // zinc-900
	},
	".cm-content": {
		// fontSize: '1.25rem'
	},

	".cm-gutters": {
		backgroundColor: "hsl(240 3.7% 15.9%) !important", //zinc-800
	},
	".cm-activeLine": {
		backgroundColor: "hsl(240 3.7% 15.9% / 50%) !important", // zinc-800
	},
	".cm-scroller": {
		scrollbarWidth: "thin",
		scrollbarColor: "hsl(240 3.7% 15.9%) hsl(240 5.9% 10%)", // <accent,background> zinc-800 ,zinc-900
	},
});

export function CodeEditor({ code, onChange }: CodeEditorProps) {
	return (
		<div className="h-full overflow-hidden">
			<CodeMirror
				value={code}
				height="100%"
				theme={playgroundTheme}
				extensions={[go(), editorBaseTheme]}
				onChange={(value) => onChange(value)}
				basicSetup={{
					lineNumbers: true,
					highlightActiveLineGutter: true,
					highlightActiveLine: true,
					foldGutter: true,
					dropCursor: true,
					allowMultipleSelections: true,
					indentOnInput: true,
					bracketMatching: true,
					closeBrackets: true,
					autocompletion: true,
					rectangularSelection: true,
					crosshairCursor: false,
					highlightSelectionMatches: true,
					searchKeymap: true,
				}}
				className="h-full [&_.cm-editor]:h-full"
			/>
		</div>
	);
}
