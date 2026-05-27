const KNOWN_KEYS = new Set([
  '$schema', 'plugin', 'provider', 'autoupdate',
  'default_agent', 'instructions', 'skills', 'model',
]);

export function validateConfig(config) {
  const warnings = [];
  const errors = [];

  for (const key of Object.keys(config)) {
    if (!KNOWN_KEYS.has(key)) {
      warnings.push(`Warning: Unrecognized config key "${key}"`);
    }
  }

  if (config.plugin !== undefined) {
    if (!Array.isArray(config.plugin)) {
      errors.push('config.plugin must be an array');
    } else if (!config.plugin.every(item => typeof item === 'string')) {
      errors.push('config.plugin must be an array of strings');
    }
  }

  if (config.default_agent !== undefined && typeof config.default_agent !== 'string') {
    errors.push('config.default_agent must be a string');
  }

  if (config.instructions !== undefined) {
    if (typeof config.instructions !== 'string' && !Array.isArray(config.instructions)) {
      errors.push('config.instructions must be a string or an array of strings');
    } else if (Array.isArray(config.instructions) && !config.instructions.every(item => typeof item === 'string')) {
      errors.push('config.instructions must be an array of strings');
    }
  }

  if (config.skills !== undefined) {
    if (typeof config.skills !== 'object' || config.skills === null || Array.isArray(config.skills)) {
      errors.push('config.skills must be an object');
    } else if (config.skills.paths !== undefined) {
      if (!Array.isArray(config.skills.paths)) {
        errors.push('config.skills.paths must be an array');
      } else if (!config.skills.paths.every(item => typeof item === 'string')) {
        errors.push('config.skills.paths must be an array of strings');
      }
    }
  }

  return { warnings, errors, valid: errors.length === 0 };
}
