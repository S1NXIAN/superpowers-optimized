#!/usr/bin/env node
/**
 * security-scan.mjs — T1/T2/T3 security pattern scanner
 *
 * Usage:
 *   node bin/security-scan.mjs file1.js file2.js ...
 *   node bin/security-scan.mjs --help
 *
 * Output: JSON array of matches, empty array if clean.
 *   [{"tier":"T1","pattern":"auth*","file":"src/auth/login.js"}, ...]
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, basename, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_DIR = join(SCRIPT_DIR, '..');
const PATTERNS_DIR = join(REPO_DIR, 'skills', 'security-triage', 'patterns');

// ── Help ─────────────────────────────────────────────────────────────
const HELP = `security-scan — automated security triage

Scans files for T1 (path), T2 (content), and T3 (directory) security
triggers using the same patterns as the security-triage skill.

Usage:
  node bin/security-scan.mjs <files...>

Output: JSON array. Empty [] = clean.

Pattern files (in skills/security-triage/patterns/):
  t1.txt        T1 file path patterns (glob)
  t3.txt        T3 directory patterns
  common.txt    T2 content patterns (all languages)
  <lang>.txt    T2 content patterns (language-specific)
`;

// ── Pattern loading ──────────────────────────────────────────────────

function loadPatternLines(filePath) {
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, 'utf8');
  const patterns = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    // Split by whitespace — patterns can be grouped on one line
    for (const p of trimmed.split(/\s+/)) {
      if (p) patterns.push(p);
    }
  }
  return patterns;
}

function loadT1Patterns() {
  return loadPatternLines(join(PATTERNS_DIR, 't1.txt'));
}

function loadT2CommonPatterns() {
  return loadPatternLines(join(PATTERNS_DIR, 'common.txt'));
}

const _patternCache = new Map();

function loadT2LanguagePatterns(ext) {
  const langMap = {
    '.js': 'js-node.txt', '.jsx': 'js-node.txt',
    '.mjs': 'js-node.txt', '.cjs': 'js-node.txt',
    '.ts': 'js-node.txt', '.tsx': 'js-node.txt',
    '.py': 'python.txt',
    '.rb': 'ruby.txt',
    '.go': 'go.txt',
    '.rs': 'rust.txt',
    '.java': 'java.txt',
    '.kt': 'kotlin.txt',
    '.swift': 'swift.txt',
    '.dart': 'dart.txt',
    '.php': 'php.txt',
    '.cs': 'csharp.txt',
    '.c': 'c.txt',
    '.cpp': 'cpp.txt', '.cc': 'cpp.txt', '.cxx': 'cpp.txt',
    '.sh': 'shell.txt', '.bash': 'shell.txt', '.zsh': 'shell.txt',
    '.sql': 'sql.txt',
  };
  const file = langMap[ext];
  if (!file) return [];
  const filePath = join(PATTERNS_DIR, file);
  if (!_patternCache.has(filePath)) {
    _patternCache.set(filePath, loadPatternLines(filePath));
  }
  return _patternCache.get(filePath);
}

function loadT3Patterns() {
  return loadPatternLines(join(PATTERNS_DIR, 't3.txt'));
}

// ── Glob matching ────────────────────────────────────────────────────

function globMatch(path, pattern) {
  // Split pattern on * to get segments
  const parts = pattern.split('*');
  if (parts.length === 1) {
    // No wildcard — substring match
    return path.includes(pattern);
  }

  let remaining = path;

  // First part must match at start
  if (parts[0]) {
    if (!remaining.startsWith(parts[0])) return false;
    remaining = remaining.slice(parts[0].length);
  }

  // Last part must match at end
  const last = parts[parts.length - 1];
  if (last) {
    if (!remaining.endsWith(last)) return false;
    remaining = remaining.slice(0, -last.length);
  }

  // Middle parts must appear in order (with anything between)
  for (let i = 1; i < parts.length - 1; i++) {
    const idx = remaining.indexOf(parts[i]);
    if (idx === -1) return false;
    remaining = remaining.slice(idx + parts[i].length);
  }

  return true;
}

// ── T1: Path matching ───────────────────────────────────────────────

// Path segments that are NOT security boundaries (non-match for T1)
const T1_NON_MATCH_DIRS = new Set(['docs', 'tests', 'sub-agents', 'templates']);

function isT1NonMatch(filePath) {
  const segments = filePath.split(/[/\\]/);
  return segments.some(seg => T1_NON_MATCH_DIRS.has(seg));
}

function checkT1(filePath, patterns) {
  if (isT1NonMatch(filePath)) return [];
  const results = [];
  const segments = filePath.split(/[/\\]/);

  for (const pattern of patterns) {
    // Patterns with '/' match against full path
    if (pattern.includes('/')) {
      if (globMatch(filePath, pattern)) {
        results.push({ tier: 'T1', pattern, file: filePath });
      }
      continue;
    }

    // Patterns without '/' match against any path segment
    for (const seg of segments) {
      if (globMatch(seg, pattern)) {
        results.push({ tier: 'T1', pattern, file: filePath });
        break;
      }
    }
  }
  return results;
}

// ── T2: Content matching ────────────────────────────────────────────

function checkT2(filePath, content, commonPatterns, langPatterns) {
  const results = [];
  const lowerContent = content.toLowerCase();

  for (const pattern of commonPatterns) {
    if (lowerContent.includes(pattern.toLowerCase())) {
      const line = findLine(content, pattern);
      results.push({ tier: 'T2', pattern, file: filePath, line, match: extractMatch(content, pattern) });
    }
  }

  for (const pattern of langPatterns) {
    if (lowerContent.includes(pattern.toLowerCase())) {
      const line = findLine(content, pattern);
      results.push({ tier: 'T2', pattern, file: filePath, line, match: extractMatch(content, pattern) });
    }
  }

  // Deduplicate by pattern name
  const seen = new Set();
  return results.filter(r => {
    if (seen.has(r.pattern)) return false;
    seen.add(r.pattern);
    return true;
  });
}

function findLine(content, pattern) {
  const lines = content.split('\n');
  const lower = pattern.toLowerCase();
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(lower)) return i + 1;
  }
  return 0;
}

function extractMatch(content, pattern) {
  const lines = content.split('\n');
  const lower = pattern.toLowerCase();
  for (const line of lines) {
    if (line.toLowerCase().includes(lower)) {
      const idx = line.toLowerCase().indexOf(lower);
      const start = Math.max(0, idx - 20);
      const end = Math.min(line.length, idx + pattern.length + 20);
      let excerpt = line.slice(start, end);
      if (start > 0) excerpt = '...' + excerpt;
      if (end < line.length) excerpt = excerpt + '...';
      return excerpt;
    }
  }
  return '';
}

// ── T3: Directory matching ──────────────────────────────────────────

function checkT3(filePath, dirPatterns) {
  const results = [];
  const segments = filePath.split('/');
  for (let i = 0; i < segments.length; i++) {
    const dir = segments.slice(0, i + 1).join('/') + '/';
    const seg = segments[i];
    for (const pattern of dirPatterns) {
      const patternDir = pattern.endsWith('/') ? pattern : pattern + '/';
      if (globMatch(dir, patternDir) || globMatch(seg, pattern)) {
        results.push({ tier: 'T3', pattern: pattern + '/', file: filePath });
        break; // One match per directory level is enough
      }
    }
  }
  return results;
}

// ── Extension detection ─────────────────────────────────────────────

function getExtension(filePath) {
  const name = basename(filePath).toLowerCase();
  // Handle .test.js, .spec.js etc — still js
  for (const ext of ['.js', '.jsx', '.ts', '.tsx', '.py', '.rb', '.go', '.rs',
    '.java', '.kt', '.swift', '.dart', '.php', '.cs', '.c', '.cpp', '.cc',
    '.cxx', '.sh', '.bash', '.zsh', '.sql', '.mjs', '.cjs']) {
    if (name.endsWith(ext)) return ext;
  }
  return '';
}

// ── Main ─────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.some(a => a === '--help')) {
    console.log(HELP);
    process.exit(args.some(a => a === '--help') ? 0 : 1);
  }

  const t1Patterns = loadT1Patterns();
  const t2Common = loadT2CommonPatterns();
  const t3Patterns = loadT3Patterns();

  const allResults = [];

  for (const filePath of args) {
    // Make relative to CWD for cleaner output
    const cwd = process.cwd();
    const relPath = relative(cwd, filePath);
    const displayPath = relPath || filePath;

    // T1: path check
    allResults.push(...checkT1(displayPath, t1Patterns));

    // T3: directory check
    allResults.push(...checkT3(displayPath, t3Patterns));

    // T2: content check
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf8');
      const ext = getExtension(filePath);
      const langPatterns = loadT2LanguagePatterns(ext);
      allResults.push(...checkT2(displayPath, content, t2Common, langPatterns));
    }
  }

  console.log(JSON.stringify(allResults, null, 2));
}

main();
