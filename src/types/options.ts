/**
 * Configuration options for markdown to ADF conversion.
 */

/**
 * Predefined context presets for common Jira use cases.
 *
 * @remarks
 * Different Jira contexts support different ADF features:
 * - `comment`: Restrictive schema, no headings, suitable for issue comments
 * - `task`: No headings (headings convert to bold), suitable for Task-type issues
 * - `story`: Full ADF support including headings, suitable for Story/Epic issues
 * - `default`: Balanced preset that works in most contexts
 */
export type ContextPreset = 'comment' | 'task' | 'story' | 'default';

/**
 * Options for customizing markdown to ADF conversion behavior.
 */
export interface ConversionOptions {
  /**
   * Use a predefined preset optimized for a specific Jira context.
   *
   * @defaultValue 'default'
   *
   * @example
   * ```ts
   * // For issue comments (no headings)
   * markdownToAdf(markdown, { preset: 'comment' });
   *
   * // For Task-type issues (headings convert to bold)
   * markdownToAdf(markdown, { preset: 'task' });
   *
   * // For Story/Epic issues (full heading support)
   * markdownToAdf(markdown, { preset: 'story' });
   * ```
   */
  preset?: ContextPreset;

  /**
   * Whether to use actual heading nodes (h1-h6) in the ADF output.
   *
   * @remarks
   * Headings are not supported in all Jira contexts:
   * - ❌ Issue comments
   * - ❌ Task-type issues
   * - ✅ Story/Epic issues (and some others)
   *
   * When `false`, markdown headings (##) are converted to bold paragraphs.
   *
   * @defaultValue false
   */
  useHeadings?: boolean;

  /**
   * Maximum heading level to allow (1-6).
   * Headings deeper than this will be converted to bold paragraphs.
   *
   * @defaultValue 6
   *
   * @example
   * ```ts
   * // Only allow h1 and h2
   * markdownToAdf(markdown, { maxHeadingLevel: 2 });
   * ```
   */
  maxHeadingLevel?: 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * Whether to preserve line breaks as hard breaks in paragraphs.
   *
   * @remarks
   * When `true`, single line breaks become `<hardBreak>` nodes.
   * When `false`, consecutive lines are merged into a single paragraph.
   *
   * @defaultValue false
   */
  preserveLineBreaks?: boolean;

  /**
   * Whether to throw errors on unsupported markdown syntax.
   *
   * @remarks
   * When `true`, throws an error if markdown contains unsupported features.
   * When `false`, silently ignores or converts unsupported features to plain text.
   *
   * @defaultValue false
   */
  strictMode?: boolean;

  /**
   * Default language for code blocks without a language specifier.
   *
   * @defaultValue 'text'
   *
   * @example
   * ```ts
   * markdownToAdf(markdown, { defaultCodeLanguage: 'javascript' });
   * ```
   */
  defaultCodeLanguage?: string;
}

/**
 * Result of a markdown to ADF conversion.
 */
export interface ConversionResult {
  /**
   * The generated ADF document.
   */
  adf: unknown;

  /**
   * Warnings generated during conversion (e.g., unsupported features).
   */
  warnings: readonly ConversionWarning[];
}

/**
 * A warning about potentially lossy or unsupported conversion.
 */
export interface ConversionWarning {
  /**
   * The type of warning.
   */
  type: 'unsupported_feature' | 'lossy_conversion' | 'invalid_syntax';

  /**
   * Human-readable warning message.
   */
  message: string;

  /**
   * Line number where the warning occurred (1-indexed), if available.
   */
  line?: number;

  /**
   * The original markdown that triggered the warning.
   */
  markdown?: string;
}
