/**
 * The Nuru language specification, injected as reference material into every
 * tutoring prompt. Kept in one place so the chat and help routes cannot drift.
 */
export const NURU_DOCS = `
# NURU LANGUAGE SPECIFICATION

## 1. COMMENTS & IDENTIFIERS
- **Single-line:** \`// comment\`
- **Multi-line:** \`/* comment */\`
- **Identifiers:** Alphanumeric + \`_\`. Cannot start with a number. Case-sensitive.
  - Example: \`fanya mwaka_wa_kuzaliwa = 2020\`

## 2. DATA TYPES & PRIMITIVES
- **Types:** \`namba\` (int/float), \`tungo\` (string), \`buliani\` (bool), \`tupu\` (null), \`vitendakazi\` (functions).
- **Booleans:** \`kweli\` (true), \`sikweli\` (false). All values are true except \`tupu\` and \`sikweli\`.
- **Operators:** \`&&\` (AND), \`||\` (OR), \`!\` (NOT), \`%\` (modulo), \`+\` (concat for lists/dicts).
- **Type names reported by \`aina()\` differ from the keywords above.** These are the exact strings, verified against the interpreter:
  - Whole number -> \`NAMBA\`
  - Decimal -> \`DESIMALI\` (integers and floats are distinct at runtime)
  - String -> \`NENO\` (not "TUNGO")
  - Boolean -> \`BOOLEAN\` (not "BULIANI")
  - Null -> \`TUPU\`
  - Array -> \`ORODHA\`
  - Dictionary -> \`KAMUSI\`
  - Function -> \`UNDO (FUNCTION)\`

## 3. ARRAYS (SAFU)
- **Syntax:** \`arr = [1, "two", kweli]\`
- **Indexing:** Zero-based. Access: \`arr[0]\`. Modify: \`arr[1] = 25\`.
- **Operations:**
  - \`+\`: Concatenate arrays (\`a + b\`).
  - \`ktk\`: Membership check (\`val ktk arr\` -> returns bool).
- **Methods:**
  - \`arr.idadi()\`: Returns length.
  - \`arr.sukuma(items...)\`: Pushes items to end.
  - \`arr.yamwisho()\`: Returns last element (or \`tupu\` if empty).

## 4. DICTIONARIES (KAMUSI)
- **Syntax:** \`d = {"key": "val", "num": 1}\`. Keys can be string, number, or bool.
- **Access:** \`d["key"]\`.
- **Modify/Add:** \`d["newKey"] = val\`.
- **Operations:**
  - \`+\`: Merge dictionaries (\`d1 + d2\`).
  - \`ktk\`: Check if Key exists (\`"key" ktk d\`).

## 5. CONTROL FLOW
### Conditionals
\`\`\`go
kama (condition) {
    // code
} sivyo {
    // code
}

\`\`\`

### Loops (Vitanzi)

Used for strings, arrays, and dictionaries.

* **Keywords:** \`kwa\` (for), \`ktk\` (in), \`vunja\` (break), \`endelea\` (continue).
* **Value Loop:**
\`\`\`go
kwa val ktk collection { andika(val) }

\`\`\`


* **Key/Index + Value Loop:**
\`\`\`go
kwa idx, val ktk collection { andika(idx, val) }

\`\`\`


*(Note: For dicts, \`idx\` is the Key)*

### Range (Mfululizo)

Generates arrays of numbers.

* \`mfululizo(end)\`: 0 to end-1.
* \`mfululizo(start, end)\`: start to end-1.
* \`mfululizo(start, end, step)\`: custom step.

## 6. FUNCTIONS (UNDO)

Functions are first-class citizens defined via \`unda\` and assigned to variables.

* **Syntax:**
\`\`\`go
myFunc = unda(param1, param2="default") {
    rudisha param1 + param2
}

\`\`\`


* **Features:** Supports closures, recursion, and implicit returns via \`rudisha\`.

## 7. BUILT-IN FUNCTIONS (VITENDAKAZI)

* \`andika(args...)\`: Print to console. Supports \`\\n\`, \`\\t\`.
  * **It does NOT add a line break.** Consecutive calls run together on one line: \`andika("Jina: Asha")\` followed by \`andika("Umri: 30")\` prints \`Jina: AshaUmri: 30\`.
  * **Multiple arguments are joined with a single space**, including the newline. \`andika("Jina:", jina, "\\n")\` prints \`Jina: Asha \` with a stray space before the line break.
  * **To control output exactly, pass ONE string** built with \`+\`:
    \`andika("Jina: " + jina + "\\n")\` prints \`Jina: Asha\` and a clean line break.
* \`tungo(value)\`: Converts any value to a string. Needed before joining a non-string with \`+\`.
* \`namba(text)\`: Parses a string into a number. \`namba("42") + 1\` is \`43\`.
* \`jaza(prompt)\`: Input from user. Returns string.
* \`aina(obj)\`: Returns type as string. See the exact names in section 2.
* \`fungua(path)\`: Opens a file reference.

## 8. STRING BUILDING

\`+\` concatenates two strings. Mixing types is an error: \`"Urefu: " + 3\` fails with
\`Aina Hazilingani: NENO + NAMBA\`. Wrap the non-string in \`tungo()\` first.

\`\`\`go
safu = ["maembe", "nanasi", "ndizi"]

// Correct: one string, exact output
andika("Urefu: " + tungo(safu.idadi()) + "\\n")

// Wrong: type error
// andika("Urefu: " + safu.idadi() + "\\n")

// Wrong: stray space before the line break
// andika("Urefu:", safu.idadi(), "\\n")
\`\`\`
`;
