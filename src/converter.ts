/**
 * Core markdown to ADF converter.
 */

import type { ADFDocument } from './types/adf.js';
import type {
  ConversionOptions,
  ConversionWarning,
  ContextPreset,
  ConversionResult,
} from './types/options.js';
import { resolveOptions } from './presets/index.js';
import { doc, paragraph } from './builders/index.js';
import { createMarkdownParser } from './markdown/parser.js';
import { BlockParser } from './converter/block-parser.js';

/**
 * Converts markdown text to Atlassian Document Format (ADF).
 *
 * @param markdown - The markdown string to convert
 * @param options - Optional conversion configuration
 * @returns The generated ADF document
 *
 * @example
 * ```ts
 * import { markdownToAdf } from 'markdown-to-adf';
 *
 * // Simple conversion
 * const adf = markdownToAdf('## Hello\n- Item 1\n- Item 2');
 *
 * // With preset for Jira comments
 * const adf = markdownToAdf(markdown, { preset: 'comment' });
 *
 * // With custom options
 * const adf = markdownToAdf(markdown, {
 *   useHeadings: false,
 *   defaultCodeLanguage: 'javascript',
 * });
 * ```
 */
export function markdownToAdf(markdown: string, options: ConversionOptions = {}): ADFDocument {
  const converter = new MarkdownConverter(options);
  return converter.convert(markdown);
}

/**
 * Converts markdown to ADF and returns conversion warnings.
 *
 * @param markdown - The markdown string to convert
 * @param options - Optional conversion configuration
 * @returns The generated ADF document plus warnings
 */
export function markdownToAdfWithWarnings(
  markdown: string,
  options: ConversionOptions = {},
): ConversionResult {
  const converter = new MarkdownConverter(options);
  return converter.convertWithWarnings(markdown);
}

/**
 * Internal converter class that maintains state during conversion.
 *
 * @internal
 */
class MarkdownConverter {
  private readonly options: Required<Omit<ConversionOptions, 'preset'>>;
  private readonly warnings: ConversionWarning[] = [];
  private readonly md = createMarkdownParser();
  private readonly preset: ContextPreset;

  constructor(options: ConversionOptions) {
    this.preset = options.preset ?? 'default';
    this.options = resolveOptions(options);
  }

  /**
   * Converts markdown to an ADF document.
   */
  convert(markdown: string): ADFDocument {
    if (!markdown || markdown.trim() === '') {
      return doc([paragraph()]);
    }

    const tokens = this.md.parse(markdown, {});
    const blocks = new BlockParser({
      options: this.options,
      preset: this.preset,
      warnings: this.warnings,
    }).parse(tokens);
    return doc(blocks.length > 0 ? blocks : [paragraph()]);
  }

  convertWithWarnings(markdown: string): ConversionResult {
    const adf = this.convert(markdown);
    return { adf, warnings: [...this.warnings] };
  }
}
