const CRITICAL = [
  /rm\s+-rf\s+\//,
  /rm\s+-rf\s+\$HOME/,
  /rm\s+-rf\s+\/[^\s]+\//,
  /git\s+push\s+--force/,
  /\bmkfs\b/,
  /dd\s+if=\/dev\/zero/,
  /chmod\s+-R\s+777\s+\//,
  /chmod\s+-R\s+777\s+\$/,
];

const DANGEROUS = [
  />\s+\S+\.(json|js|ts|md|yaml|yml|toml)\b/,
  /\bdrop\s+(table|database)\b/i,
  /\bkill\s+-9\b/,
  /\bchmod\s+-R\b/,
];

const SUSPICIOUS = [
  /\bsudo\b.+\brm\b/,
  /rm\s+.*\.git\b/,
  /\bchown\b/,
];

export const PATTERNS = { CRITICAL, DANGEROUS, SUSPICIOUS };

const SEVERITIES = [
  { name: 'CRITICAL', tier: CRITICAL },
  { name: 'DANGEROUS', tier: DANGEROUS },
  { name: 'SUSPICIOUS', tier: SUSPICIOUS },
];

export function checkCommand(cmd) {
  if (cmd.startsWith('DANGEROUS_CMD_ACCEPTED=true')) {
    return null;
  }

  for (const { name, tier } of SEVERITIES) {
    for (const pattern of tier) {
      if (pattern.test(cmd)) {
        return {
          severity: name,
          message: `Command matched ${name} pattern: ${pattern}`,
          match: pattern,
        };
      }
    }
  }

  return null;
}
