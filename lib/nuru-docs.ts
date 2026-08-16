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
* \`jaza(prompt)\`: Input from user. Returns string.
* \`aina(obj)\`: Returns type as string (e.g., "NAMBA").
* \`fungua(path)\`: Opens a file reference.
`;
