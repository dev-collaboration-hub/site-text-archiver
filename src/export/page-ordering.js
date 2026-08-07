export function comparePageRecords(a, b, startUrl = null) {
  const aStart = startUrl && (a.canonicalUrl === startUrl || a.url === startUrl) ? 0 : 1;
  const bStart = startUrl && (b.canonicalUrl === startUrl || b.url === startUrl) ? 0 : 1;
  return (
    aStart - bStart ||
    (Number.isInteger(a.navigationSequence) ? a.navigationSequence : Number.MAX_SAFE_INTEGER) -
      (Number.isInteger(b.navigationSequence) ? b.navigationSequence : Number.MAX_SAFE_INTEGER) ||
    (Number.isInteger(a.depth) ? a.depth : Number.MAX_SAFE_INTEGER) -
      (Number.isInteger(b.depth) ? b.depth : Number.MAX_SAFE_INTEGER) ||
    (Number.isInteger(a.discoverySequence) ? a.discoverySequence : Number.MAX_SAFE_INTEGER) -
      (Number.isInteger(b.discoverySequence) ? b.discoverySequence : Number.MAX_SAFE_INTEGER) ||
    String(a.canonicalUrl ?? a.url ?? "").localeCompare(String(b.canonicalUrl ?? b.url ?? "")) ||
    String(a.pageId ?? "").localeCompare(String(b.pageId ?? ""))
  );
}

export function orderPageRecords(pageRecords = [], startUrl = null) {
  return [...pageRecords].sort((a, b) => comparePageRecords(a, b, startUrl));
}
