import { readFileSync, existsSync } from 'node:fs';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'and', 'or', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'can',
  'could', 'may', 'might', 'shall', 'should', 'not', 'no', 'from',
  'this', 'that', 'these', 'those', 'it', 'its', 'by',
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

function jaccardSimilarity(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function parseEntries(content) {
  const sections = content.split(/\n(?=## )/);
  const entries = [];

  for (const section of sections) {
    const lines = section.split('\n');
    const titleLine = lines.find(l => l.startsWith('## '));
    if (!titleLine) continue;

    const title = titleLine.replace(/^## /, '').trim();
    if (!title) continue;

    const entry = { title };

    for (const line of lines) {
      const errorMatch = line.match(/^\*\*Error:\*\*\s*(.+)/);
      if (errorMatch) entry.error = errorMatch[1].trim();

      const rootCauseMatch = line.match(/^\*\*Root cause:\*\*\s*(.+)/);
      if (rootCauseMatch) entry.rootCause = rootCauseMatch[1].trim();

      const fixMatch = line.match(/^\*\*Fix:\*\*\s*(.+)/);
      if (fixMatch) entry.fix = fixMatch[1].trim();

      const contextMatch = line.match(/^\*\*Context:\*\*\s*(.+)/);
      if (contextMatch) entry.context = contextMatch[1].trim();

      const firstSeenMatch = line.match(/^\*\*First seen:\*\*\s*(.+)/);
      if (firstSeenMatch) entry.firstSeen = firstSeenMatch[1].trim();
    }

    if (entry.rootCause && entry.fix && entry.firstSeen) {
      entries.push(entry);
    }
  }

  return entries;
}

function findMatchingTitle(entries, errorMessage) {
  const msgTokens = tokenize(errorMessage);

  for (const entry of entries) {
    const titleTokens = tokenize(entry.title);
    const similarity = jaccardSimilarity(msgTokens, titleTokens);
    if (similarity >= 0.3) {
      return entry;
    }
  }

  return null;
}

function findMatchingError(entries, errorMessage) {
  const msg = errorMessage.toLowerCase();
  for (const entry of entries) {
    if (entry.error) {
      const errorLine = entry.error.toLowerCase();
      if (msg.includes(errorLine) || errorLine.includes(msg)) {
        return entry;
      }
    }
  }
  return null;
}

export function findMatchingEntry(filePath, errorMessage) {
  if (!existsSync(filePath)) return null;

  let content;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }

  if (!content.trim()) return null;

  const entries = parseEntries(content);
  if (entries.length === 0) return null;

  const titleMatch = findMatchingTitle(entries, errorMessage);
  if (titleMatch) return titleMatch;

  const errorMatch = findMatchingError(entries, errorMessage);
  if (errorMatch) return errorMatch;

  return null;
}
