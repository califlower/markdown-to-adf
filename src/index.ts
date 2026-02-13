/**
 * markdown-to-adf - Convert Markdown to Atlassian Document Format
 *
 * A robust, type-safe library for converting Markdown to ADF with context-aware
 * presets for different Jira use cases.
 *
 * @example
 * ```ts
 * import { markdownToAdf } from 'markdown-to-adf';
 *
 * // Simple conversion
 * const adf = markdownToAdf('## Hello World\n- Item 1\n- Item 2');
 *
 * // For Jira comments (no headings)
 * const adf = markdownToAdf(markdown, { preset: 'comment' });
 *
 * // For Task-type issues (headings convert to bold)
 * const adf = markdownToAdf(markdown, { preset: 'task' });
 *
 * // For Story/Epic issues (full heading support)
 * const adf = markdownToAdf(markdown, { preset: 'story' });
 * ```
 *
 * @packageDocumentation
 */

// Main converter functions
export { markdownToAdf, markdownToAdfWithWarnings } from './converter.js';

// Type exports
export type {
  // ADF types
  ADFDocument,
  ADFBlockNode,
  ADFInlineNode,
  ADFParagraph,
  ADFHeading,
  ADFBulletList,
  ADFOrderedList,
  ADFListItem,
  ADFCodeBlock,
  ADFBlockQuote,
  ADFRule,
  ADFPanel,
  ADFText,
  ADFHardBreak,
  ADFInlineCard,
  ADFMention,
  ADFEmoji,
  ADFMark,
  ADFStrongMark,
  ADFEmMark,
  ADFCodeMark,
  ADFStrikeMark,
  ADFUnderlineMark,
  ADFLinkMark,
  ADFTextColorMark,

  // Conversion types
  ContextPreset,
  ConversionOptions,
  ConversionResult,
  ConversionWarning,
} from './types/index.js';

// Builder exports (for advanced usage)
export {
  doc,
  paragraph,
  heading,
  bulletList,
  orderedList,
  listItem,
  codeBlock,
  blockQuote,
  rule,
  text,
  hardBreak,
  strong,
  em,
  code,
  strike,
  underline,
  link,
} from './builders/index.js';
