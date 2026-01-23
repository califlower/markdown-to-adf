/**
 * Predefined conversion presets for common Jira contexts.
 */

import type { ConversionOptions, ContextPreset } from '../types/options.js';

/**
 * Configuration for each context preset.
 *
 * @internal
 */
const PRESET_CONFIGS: Record<ContextPreset, Required<Omit<ConversionOptions, 'preset'>>> = {
  /**
   * Default preset - works in most contexts.
   * Conservative settings that avoid unsupported features.
   */
  default: {
    useHeadings: false,
    maxHeadingLevel: 6,
    preserveLineBreaks: false,
    strictMode: false,
    defaultCodeLanguage: 'text',
  },

  /**
   * Comment preset - for Jira issue comments.
   * Most restrictive: no headings, converts to bold paragraphs.
   */
  comment: {
    useHeadings: false,
    maxHeadingLevel: 6,
    preserveLineBreaks: false,
    strictMode: false,
    defaultCodeLanguage: 'text',
  },

  /**
   * Task preset - for Task-type Jira issues.
   * No heading support, converts headings to bold paragraphs.
   */
  task: {
    useHeadings: false,
    maxHeadingLevel: 6,
    preserveLineBreaks: false,
    strictMode: false,
    defaultCodeLanguage: 'text',
  },

  /**
   * Story preset - for Story/Epic Jira issues.
   * Full ADF support including actual heading nodes.
   */
  story: {
    useHeadings: true,
    maxHeadingLevel: 6,
    preserveLineBreaks: false,
    strictMode: false,
    defaultCodeLanguage: 'text',
  },
};

/**
 * Resolves a preset name to its full configuration.
 *
 * @param preset - The preset name to resolve
 * @returns The full configuration for the preset
 *
 * @internal
 */
export function resolvePreset(preset: ContextPreset): Required<Omit<ConversionOptions, 'preset'>> {
  return PRESET_CONFIGS[preset];
}

/**
 * Merges user options with preset configuration.
 *
 * @param options - User-provided options
 * @returns Fully resolved options with all defaults applied
 *
 * @internal
 */
export function resolveOptions(options: ConversionOptions = {}): Required<Omit<ConversionOptions, 'preset'>> {
  const preset = options.preset ?? 'default';
  const presetConfig = resolvePreset(preset);

  return {
    useHeadings: options.useHeadings ?? presetConfig.useHeadings,
    maxHeadingLevel: options.maxHeadingLevel ?? presetConfig.maxHeadingLevel,
    preserveLineBreaks: options.preserveLineBreaks ?? presetConfig.preserveLineBreaks,
    strictMode: options.strictMode ?? presetConfig.strictMode,
    defaultCodeLanguage: options.defaultCodeLanguage ?? presetConfig.defaultCodeLanguage,
  };
}
