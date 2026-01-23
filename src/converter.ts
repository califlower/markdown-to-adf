/**
 * Core markdown to ADF converter.
 */

import type {
  ADFDocument,
  ADFBlockNode,
  ADFParagraph,
  ADFListItem,
  ADFTaskItem,
} from './types/adf.js';
import type { ConversionOptions, ConversionWarning } from './types/options.js';
import { resolveOptions } from './presets/index.js';
import {
  doc,
  paragraph,
  heading,
  bulletList,
  orderedList,
  listItem,
  taskList,
  taskItem,
  codeBlock,
  blockQuote,
  text,
  table,
  tableRow,
  tableHeader,
  tableCell,
} from './builders/index.js';
import { strong } from './builders/marks.js';
import { parseInlineMarkdown } from './utils/inline-parser.js';

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
 * Internal converter class that maintains state during conversion.
 *
 * @internal
 */
class MarkdownConverter {
  private readonly options: Required<Omit<ConversionOptions, 'preset'>>;
  private readonly warnings: ConversionWarning[] = [];

  constructor(options: ConversionOptions) {
    this.options = resolveOptions(options);
  }

  /**
   * Converts markdown to an ADF document.
   */
  convert(markdown: string): ADFDocument {
    if (!markdown || markdown.trim() === '') {
      return doc([paragraph()]);
    }

    const lines = markdown.split('\n');
    const blocks: ADFBlockNode[] = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i]!;

      // Skip empty lines
      if (line.trim() === '') {
        i++;
        continue;
      }

      // Code block
      if (line.startsWith('```')) {
        const result = this.parseCodeBlock(lines, i);
        blocks.push(result.node);
        i = result.nextIndex;
        continue;
      }

      // Heading
      const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
      if (headingMatch) {
        const level = headingMatch[1]!.length as 1 | 2 | 3 | 4 | 5 | 6;
        const headingText = headingMatch[2]!;

        if (this.options.useHeadings && level <= this.options.maxHeadingLevel) {
          blocks.push(heading(level, parseInlineMarkdown(headingText)));
        } else {
          // Convert heading to bold paragraph
          blocks.push(paragraph([text(headingText, [strong()])]));
        }
        i++;
        continue;
      }

      // Table
      if (line.trim().startsWith('|')) {
        const result = this.parseTable(lines, i);
        if (result) {
          blocks.push(result.node);
          i = result.nextIndex;
          continue;
        }
      }

      // Task list (checkbox list)
      if (/^[\s]*-\s+\[([ xX])\]\s+/.test(line)) {
        const result = this.parseTaskList(lines, i);
        blocks.push(result.node);
        i = result.nextIndex;
        continue;
      }

      // Unordered list
      if (/^[\s]*[-*]\s+/.test(line)) {
        const result = this.parseList(lines, i, 'bullet');
        blocks.push(result.node);
        i = result.nextIndex;
        continue;
      }

      // Ordered list
      if (/^[\s]*\d+\.\s+/.test(line)) {
        const result = this.parseList(lines, i, 'ordered');
        blocks.push(result.node);
        i = result.nextIndex;
        continue;
      }

      // Block quote
      if (line.startsWith('>')) {
        const result = this.parseBlockQuote(lines, i);
        blocks.push(result.node);
        i = result.nextIndex;
        continue;
      }

      // Horizontal rule
      if (/^[-*_]{3,}$/.test(line.trim())) {
        // Note: horizontal rules not commonly supported in Jira
        this.addWarning('unsupported_feature', 'Horizontal rules are not widely supported', i + 1, line);
        i++;
        continue;
      }

      // Regular paragraph
      blocks.push(paragraph(parseInlineMarkdown(line)));
      i++;
    }

    return doc(blocks);
  }

  /**
   * Parses a code block starting at the given line index.
   */
  private parseCodeBlock(lines: readonly string[], startIndex: number): { node: ADFBlockNode; nextIndex: number } {
    const firstLine = lines[startIndex]!;
    const language = firstLine.slice(3).trim() || this.options.defaultCodeLanguage;
    const codeLines: string[] = [];

    let i = startIndex + 1;
    while (i < lines.length) {
      const line = lines[i]!;
      if (line.startsWith('```')) {
        // End of code block
        i++;
        break;
      }
      codeLines.push(line);
      i++;
    }

    return {
      node: codeBlock(codeLines.join('\n'), language),
      nextIndex: i,
    };
  }

  /**
   * Parses a task list (checkbox list) starting at the given line index.
   */
  private parseTaskList(
    lines: readonly string[],
    startIndex: number
  ): { node: ADFBlockNode; nextIndex: number } {
    const items: ADFTaskItem[] = [];
    const pattern = /^[\s]*-\s+\[([ xX])\]\s+(.+)$/;

    let i = startIndex;
    while (i < lines.length) {
      const line = lines[i]!;
      const match = pattern.exec(line);

      if (!match) {
        // End of task list
        break;
      }

      const checked = match[1]!.toLowerCase() === 'x';
      const itemText = match[2]!;
      const itemContent = parseInlineMarkdown(itemText);
      items.push(taskItem(itemContent, checked));
      i++;
    }

    return { node: taskList(items), nextIndex: i };
  }

  /**
   * Parses a list (bullet or ordered) starting at the given line index.
   */
  private parseList(
    lines: readonly string[],
    startIndex: number,
    listType: 'bullet' | 'ordered'
  ): { node: ADFBlockNode; nextIndex: number } {
    const items: ADFListItem[] = [];
    const pattern = listType === 'bullet' ? /^[\s]*[-*]\s+(.+)$/ : /^[\s]*\d+\.\s+(.+)$/;

    let i = startIndex;
    while (i < lines.length) {
      const line = lines[i]!;
      const match = pattern.exec(line);

      if (!match) {
        // End of list
        break;
      }

      const itemText = match[1]!;
      const itemContent: ADFParagraph = paragraph(parseInlineMarkdown(itemText));
      items.push(listItem([itemContent]));
      i++;
    }

    const node = listType === 'bullet' ? bulletList(items) : orderedList(items);
    return { node, nextIndex: i };
  }

  /**
   * Parses a block quote starting at the given line index.
   */
  private parseBlockQuote(lines: readonly string[], startIndex: number): { node: ADFBlockNode; nextIndex: number } {
    const quoteLines: string[] = [];

    let i = startIndex;
    while (i < lines.length) {
      const line = lines[i]!;
      if (!line.startsWith('>')) {
        // End of block quote
        break;
      }
      quoteLines.push(line.slice(1).trim());
      i++;
    }

    // Recursively convert the quote content
    const quoteContent = quoteLines.join('\n');
    const innerDoc = this.convert(quoteContent);

    return {
      node: blockQuote(innerDoc.content),
      nextIndex: i,
    };
  }

  /**
   * Parses a markdown table starting at the given line index.
   */
  private parseTable(
    lines: readonly string[],
    startIndex: number
  ): { node: ADFBlockNode; nextIndex: number } | null {
    const firstLine = lines[startIndex]!.trim();
    if (!firstLine.startsWith('|')) return null;

    // Check if next line is a separator line (e.g., |---|---|)
    if (startIndex + 1 >= lines.length) return null;
    const secondLine = lines[startIndex + 1]!.trim();
    if (!/^\|[\s\-:|]+\|/.test(secondLine)) return null;

    // Parse header row
    const headerCells = this.parseTableRow(firstLine);
    const rows = [tableRow(headerCells.map(cell => tableHeader([paragraph(cell)])))];

    // Parse data rows
    let i = startIndex + 2; // Skip header and separator
    while (i < lines.length) {
      const line = lines[i]!.trim();
      if (!line.startsWith('|')) {
        // End of table
        break;
      }
      const cells = this.parseTableRow(line);
      rows.push(tableRow(cells.map(cell => tableCell([paragraph(cell)]))));
      i++;
    }

    return {
      node: table(rows, { isNumberColumnEnabled: false, layout: 'default' }),
      nextIndex: i,
    };
  }

  /**
   * Parses a single table row and returns the cell contents.
   */
  private parseTableRow(line: string): Array<ReturnType<typeof parseInlineMarkdown>> {
    // Remove leading/trailing pipes and split by pipe
    const content = line.replace(/^\||\|$/g, '').trim();
    const cells = content.split('|').map(cell => {
      const trimmed = cell.trim();
      return parseInlineMarkdown(trimmed);
    });
    return cells;
  }

  /**
   * Adds a warning to the warnings array.
   */
  private addWarning(
    type: ConversionWarning['type'],
    message: string,
    line?: number,
    markdown?: string
  ): void {
    const warning: ConversionWarning = { type, message };
    if (line !== undefined) warning.line = line;
    if (markdown !== undefined) warning.markdown = markdown;
    this.warnings.push(warning);
  }
}
