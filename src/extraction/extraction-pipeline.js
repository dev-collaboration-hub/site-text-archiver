import { parseHtml } from "./html-parser.js";
import { cleanDocument } from "./dom-cleaner.js";
import { detectMainContent } from "./main-content-detector.js";
import { extractSemanticContent } from "./content-extractor.js";
import { buildPageRecord } from "./page-record.js";

export async function extractPageFromHtml(input, dependencies = {}) {
  const parsed = parseHtml(input.html);
  if (!parsed.ok) return parsed;
  const cleaned = cleanDocument(parsed.value.document);
  if (!cleaned.ok) return cleaned;
  const selected = detectMainContent(cleaned.value.document);
  if (!selected.ok) return selected;
  const extracted = extractSemanticContent(
    cleaned.value.document,
    selected.value.selectedRoots,
    input.url
  );
  if (!extracted.ok) return extracted;

  return buildPageRecord({
    task: input.task,
    url: input.url,
    canonicalUrl: input.canonicalUrl,
    fetchedAt: input.fetchedAt,
    extractedAt: input.extractedAt,
    parseWarnings: parsed.value.warnings,
    cleanWarnings: cleaned.value.warnings,
    selectionWarnings: selected.value.warnings,
    extraction: extracted.value,
    extractionEvidence: {
      removalStats: cleaned.value.removalStats,
      mainContent: {
        confidence: selected.value.confidence,
        candidateScores: selected.value.candidateScores
      }
    }
  }, dependencies);
}
