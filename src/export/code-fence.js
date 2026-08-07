export function longestBacktickRun(value = "") {
  let longest = 0;
  let current = 0;
  for (const character of String(value)) {
    if (character === "`") {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

export function createCodeFence(code = "") {
  return "`".repeat(Math.max(3, longestBacktickRun(code) + 1));
}

export function renderCodeBlock(code = "", language = null) {
  const fence = createCodeFence(code);
  const hint = typeof language === "string" ? language.trim().replace(/[^a-zA-Z0-9_+.#-]/g, "") : "";
  const body = String(code).replace(/\r\n?/g, "\n");
  return `${fence}${hint}\n${body}\n${fence}`;
}

export function renderInlineCode(code = "") {
  const text = String(code).replace(/[\r\n]+/g, " ");
  const fence = "`".repeat(Math.max(1, longestBacktickRun(text) + 1));
  const padding = /^\s|\s$/.test(text) ? " " : "";
  return `${fence}${padding}${text}${padding}${fence}`;
}
