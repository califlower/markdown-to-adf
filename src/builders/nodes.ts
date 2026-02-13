/**
 * Pure functions for building ADF nodes.
 * Each function creates a properly-typed ADF node without side effects.
 */

import type {
  ADFDocument,
  ADFParagraph,
  ADFHeading,
  ADFBulletList,
  ADFOrderedList,
  ADFTaskList,
  ADFTaskItem,
  ADFListItem,
  ADFCodeBlock,
  ADFBlockQuote,
  ADFRule,
  ADFText,
  ADFHardBreak,
  ADFBlockNode,
  ADFInlineNode,
  ADFMark,
  ADFTable,
  ADFTableRow,
  ADFTableHeader,
  ADFTableCell,
} from '../types/adf.js';

/**
 * Creates an ADF document root node.
 *
 * @param content - Array of block nodes to include in the document
 * @returns A complete ADF document
 */
export function doc(content: readonly ADFBlockNode[]): ADFDocument {
  return {
    type: 'doc',
    version: 1,
    content,
  };
}

/**
 * Creates a paragraph node.
 *
 * @param content - Array of inline nodes (text, links, etc.)
 * @returns A paragraph node
 */
export function paragraph(content: readonly ADFInlineNode[] = []): ADFParagraph {
  return content.length > 0 ? { type: 'paragraph', content } : { type: 'paragraph' };
}

/**
 * Creates a heading node.
 *
 * @param level - Heading level (1-6)
 * @param content - Array of inline nodes
 * @returns A heading node
 */
export function heading(
  level: 1 | 2 | 3 | 4 | 5 | 6,
  content: readonly ADFInlineNode[],
): ADFHeading {
  return {
    type: 'heading',
    attrs: { level },
    content,
  };
}

/**
 * Creates a bullet list node.
 *
 * @param items - Array of list items
 * @returns A bullet list node
 */
export function bulletList(items: readonly ADFListItem[]): ADFBulletList {
  return {
    type: 'bulletList',
    content: items,
  };
}

/**
 * Creates an ordered list node.
 *
 * @param items - Array of list items
 * @returns An ordered list node
 */
export function orderedList(items: readonly ADFListItem[]): ADFOrderedList {
  return {
    type: 'orderedList',
    content: items,
  };
}

/**
 * Creates a list item node.
 *
 * @param content - Array of paragraphs or nested lists
 * @returns A list item node
 */
export function listItem(
  content: readonly (ADFParagraph | ADFBulletList | ADFOrderedList)[],
): ADFListItem {
  return {
    type: 'listItem',
    content,
  };
}

/**
 * Creates a task list node (checkbox list).
 *
 * @param items - Array of task items
 * @param localId - Optional local ID for the task list
 * @returns A task list node
 */
export function taskList(items: readonly ADFTaskItem[], localId?: string): ADFTaskList {
  return {
    type: 'taskList',
    attrs: { localId: localId || generateLocalId() },
    content: items,
  };
}

/**
 * Creates a task item node (checkbox item).
 *
 * @param content - Array of inline nodes
 * @param checked - Whether the task is checked
 * @param localId - Optional local ID for the task item
 * @returns A task item node
 */
export function taskItem(
  content: readonly ADFInlineNode[],
  checked: boolean = false,
  localId?: string,
): ADFTaskItem {
  return {
    type: 'taskItem',
    attrs: {
      localId: localId || generateLocalId(),
      state: checked ? 'DONE' : 'TODO',
    },
    content,
  };
}

/**
 * Generates a unique local ID for task lists/items.
 * @internal
 */
function generateLocalId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a code block node.
 *
 * @param code - The code content as a string
 * @param language - Optional language for syntax highlighting
 * @returns A code block node
 */
export function codeBlock(code: string, language?: string): ADFCodeBlock {
  const textNode: ADFText = { type: 'text', text: code };

  return language
    ? {
        type: 'codeBlock',
        attrs: { language },
        content: [textNode],
      }
    : {
        type: 'codeBlock',
        content: [textNode],
      };
}

/**
 * Creates a block quote node.
 *
 * @param content - Array of block nodes inside the quote
 * @returns A block quote node
 */
export function blockQuote(content: readonly ADFBlockNode[]): ADFBlockQuote {
  return {
    type: 'blockQuote',
    content,
  };
}

/**
 * Creates a horizontal rule (divider) node.
 *
 * @returns A rule node
 */
export function rule(): ADFRule {
  return { type: 'rule' };
}

/**
 * Creates a text node with optional formatting marks.
 *
 * @param text - The text content
 * @param marks - Optional array of formatting marks (bold, italic, etc.)
 * @returns A text node
 */
export function text(text: string, marks?: readonly ADFMark[]): ADFText {
  return marks && marks.length > 0 ? { type: 'text', text, marks } : { type: 'text', text };
}

/**
 * Creates a hard line break node.
 *
 * @returns A hard break node
 */
export function hardBreak(): ADFHardBreak {
  return { type: 'hardBreak' };
}

/**
 * Creates a table node.
 *
 * @param rows - Array of table rows
 * @param options - Optional table attributes
 * @returns A table node
 */
export function table(
  rows: readonly ADFTableRow[],
  options?: { isNumberColumnEnabled?: boolean; layout?: 'default' | 'wide' | 'full-width' },
): ADFTable {
  return options
    ? {
        type: 'table',
        attrs: {
          isNumberColumnEnabled: options.isNumberColumnEnabled ?? false,
          layout: options.layout ?? 'default',
        },
        content: rows,
      }
    : {
        type: 'table',
        content: rows,
      };
}

/**
 * Creates a table row node.
 *
 * @param cells - Array of table cells or headers
 * @returns A table row node
 */
export function tableRow(cells: readonly (ADFTableCell | ADFTableHeader)[]): ADFTableRow {
  return {
    type: 'tableRow',
    content: cells,
  };
}

/**
 * Creates a table header cell node.
 *
 * @param content - Array of paragraphs
 * @returns A table header cell node
 */
export function tableHeader(content: readonly ADFParagraph[]): ADFTableHeader {
  return {
    type: 'tableHeader',
    attrs: {},
    content,
  };
}

/**
 * Creates a table data cell node.
 *
 * @param content - Array of paragraphs
 * @returns A table data cell node
 */
export function tableCell(content: readonly ADFParagraph[]): ADFTableCell {
  return {
    type: 'tableCell',
    attrs: {},
    content,
  };
}
