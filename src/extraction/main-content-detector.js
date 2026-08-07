import {
  classTokens,
  elementCount,
  findElements,
  getAttribute,
  idTokens,
  linkTextLength,
  textContent
} from "./dom-utils.js";
import { failure, success } from "../shared/result.js";

const CONTENT_TOKENS = new Set(["content", "docs", "documentation", "article", "post", "guide", "markdown", "main"]);
const NAV_TOKENS = new Set(["nav", "navbar", "sidebar", "toc", "menu", "footer", "header", "breadcrumb"]);

function candidateKind(node) {
  if (node.tagName === "main") return "main";
  if (node.tagName === "article") return "article";
  if ((getAttribute(node, "role") ?? "").toLowerCase() === "main") return "role-main";
  const tokens = [...classTokens(node), ...idTokens(node)];
  if (tokens.some(token => CONTENT_TOKENS.has(token))) return "content-token";
  if (node.tagName === "body") return "body";
  return null;
}

function scoreCandidate(node, path, kind) {
  const textLength = textContent(node).length;
  const paragraphs = elementCount(node, ["p"]);
  const headings = elementCount(node, ["h1", "h2", "h3", "h4", "h5", "h6"]);
  const codeBlocks = elementCount(node, ["pre"]);
  const tables = elementCount(node, ["table"]);
  const linksLength = linkTextLength(node);
  const linkDensity = textLength > 0 ? linksLength / textLength : 1;
  const tokens = [...classTokens(node), ...idTokens(node), node.tagName];
  const navigationSignals = tokens.filter(token => NAV_TOKENS.has(token)).length;
  const semanticBonus = kind === "main" ? 90 : kind === "article" ? 75 : kind === "role-main" ? 85 : kind === "content-token" ? 55 : 0;
  const veryShortPenalty = textLength < 120 ? 100 : textLength < 300 ? 40 : 0;
  const score =
    Math.min(260, Math.log2(Math.max(1, textLength)) * 22) +
    Math.min(120, paragraphs * 10) +
    Math.min(100, headings * 14) +
    Math.min(80, codeBlocks * 18) +
    Math.min(60, tables * 16) +
    semanticBonus -
    Math.min(180, linkDensity * 220) -
    navigationSignals * 80 -
    veryShortPenalty;

  return {
    path,
    kind,
    score: Math.round(score * 100) / 100,
    evidence: {
      textLength,
      paragraphs,
      headings,
      codeBlocks,
      tables,
      linkDensity: Math.round(linkDensity * 1000) / 1000,
      navigationSignals,
      semanticBonus,
      veryShortPenalty
    },
    node
  };
}

export function detectMainContent(documentNode) {
  if (!documentNode || documentNode.type !== "document") {
    return failure("NO_CONTENT_CANDIDATE", "Main-content detector requires a document");
  }

  const rawCandidates = findElements(documentNode, node => Boolean(candidateKind(node)));
  const deduped = [];
  const seen = new Set();
  for (const entry of rawCandidates) {
    if (seen.has(entry.node)) continue;
    seen.add(entry.node);
    deduped.push(scoreCandidate(entry.node, entry.path, candidateKind(entry.node)));
  }

  if (deduped.length === 0) {
    return failure("NO_CONTENT_CANDIDATE", "No extractable content root was found");
  }

  const explicit = deduped.filter(candidate => candidate.kind !== "body" && candidate.evidence.textLength >= 40);
  const selectionPool = explicit.length > 0 ? explicit : deduped;
  selectionPool.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  deduped.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));

  const selected = selectionPool[0];
  const runnerUp = selectionPool[1];
  const gap = runnerUp ? selected.score - runnerUp.score : Math.max(0, selected.score);
  const confidence = Math.max(0, Math.min(1, 0.45 + gap / 220 + (selected.kind === "main" || selected.kind === "role-main" ? 0.15 : 0)));
  const warnings = [];
  if (selected.evidence.textLength < 120) warnings.push({ code: "LOW_CONTENT_CANDIDATE", evidence: selected.evidence });
  if (confidence < 0.55) warnings.push({ code: "LOW_CONTENT_CANDIDATE", confidence });

  return success({
    selectedRoots: [{ node: selected.node, path: selected.path }],
    candidateScores: deduped.map(({ node: _node, ...candidate }) => candidate),
    confidence: Math.round(confidence * 1000) / 1000,
    warnings
  });
}
