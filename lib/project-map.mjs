import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import { execSync } from 'node:child_process';

function getGitHash(projectRoot) {
  try {
    return execSync('git rev-parse HEAD', { cwd: projectRoot, stdio: 'pipe' })
      .toString()
      .trim();
  } catch {
    return 'no-git';
  }
}

export function parseMapHash(content) {
  const match = content.match(/Git:\s*([a-f0-9]+)/);
  return match ? match[1] : null;
}

export function isMapStale(projectRoot, mapHash) {
  try {
    const currentHash = execSync('git rev-parse HEAD', {
      cwd: projectRoot,
      stdio: 'pipe',
    })
      .toString()
      .trim();
    return currentHash !== mapHash;
  } catch {
    return true;
  }
}

export function truncateMap(content, lineLimit) {
  const lines = content.split('\n');
  if (lines.length <= lineLimit) return content;

  const hotStart = lines.findIndex(l => l.startsWith('## Hot Files'));
  const constraintStart = lines.findIndex(l => l.startsWith('## Critical Constraints'));

  const kept = [];

  if (lines[0]?.startsWith('# ')) kept.push(lines[0]);
  const genLine = lines.find(l => l.startsWith('Generated:'));
  if (genLine) kept.push(genLine);

  const contextNote = '*(Full map: project-map.md — truncated from ' + lines.length + ' to ' + kept.length + ' lines)*';

  if (hotStart !== -1) {
    let end = constraintStart !== -1 ? constraintStart : lines.length;
    for (let i = hotStart; i < end; i++) {
      kept.push(lines[i]);
    }
  }

  if (constraintStart !== -1) {
    for (let i = constraintStart; i < lines.length; i++) {
      kept.push(lines[i]);
    }
  }

  const footer = '\n\n' + contextNote;
  return kept.join('\n') + footer;
}

export function generateMap(projectRoot) {
  const hash = getGitHash(projectRoot);
  const now = new Date().toISOString().slice(0, 10);
  const lines = [];

  lines.push('# Project Map');
  lines.push('Generated: ' + now + ' | Git: ' + hash);
  lines.push('');

  const srcDir = join(projectRoot, 'src');
  const libDir = join(projectRoot, 'lib');
  let scanDir;
  if (existsSync(srcDir)) {
    scanDir = srcDir;
  } else if (existsSync(libDir)) {
    scanDir = libDir;
  } else {
    scanDir = projectRoot;
  }

  lines.push('## Directory Structure');
  lines.push('');
  lines.push('```');
  if (existsSync(scanDir)) {
    printTree(scanDir, '', lines, projectRoot);
  } else {
    lines.push('(no src/ or lib/ directory found)');
  }
  lines.push('```');
  lines.push('');

  lines.push('## Key Files');
  lines.push('');

  const keyFiles = [
    'package.json',
    'index.js',
    'src/index.js',
    'src/main.js',
    'app.js',
    'server.js',
    'CLAUDE.md',
    'AGENTS.md',
    'README.md',
    'lib/index.js',
  ];

  for (const file of keyFiles) {
    const fullPath = join(projectRoot, file);
    if (existsSync(fullPath)) {
      const desc = guessDescription(file);
      lines.push('- `' + file + '` — ' + desc);
    }
  }
  lines.push('');

  lines.push('## Critical Constraints');
  lines.push('');
  lines.push('<!-- Add project-specific constraints here -->');

  lines.push('');
  lines.push('## Hot Files');
  lines.push('');
  lines.push('<!-- List files most relevant to active work here -->');

  return lines.join('\n');
}

function guessDescription(filePath) {
  const name = basename(filePath);
  if (name === 'package.json') return 'Project metadata and dependencies';
  if (name === 'index.js') return 'Main entry point';
  if (name === 'main.js') return 'Application entry point';
  if (name === 'app.js') return 'Application setup and configuration';
  if (name === 'server.js') return 'HTTP server entry point';
  if (name === 'CLAUDE.md') return 'Agent context configuration';
  if (name === 'AGENTS.md') return 'Agent behavior configuration';
  if (name === 'README.md') return 'Project overview and documentation';
  if (name === 'lib/index.js') return 'Library index / barrel export';
  return 'Source file';
}

function printTree(dir, prefix, lines, root) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  const filtered = entries.filter(e => !e.startsWith('.') && e !== 'node_modules');
  const sorted = filtered.sort();

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    const rel = relative(root, fullPath);
    const isLast = i === sorted.length - 1;
    const connector = isLast ? '└── ' : '├── ';

    if (stat.isDirectory()) {
      lines.push(prefix + connector + entry + '/');
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      printTree(fullPath, nextPrefix, lines, root);
    } else {
      lines.push(prefix + connector + entry);
    }
  }
}
