/**
 * Atlassian Document Format (ADF) type definitions.
 *
 * @see https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/
 */

/**
 * The root ADF document node.
 * All ADF documents must start with this node type.
 */
export interface ADFDocument {
  readonly type: 'doc';
  readonly version: 1;
  readonly content: ReadonlyArray<ADFBlockNode>;
}

/**
 * Block-level nodes that can appear in a document.
 * These define the structural elements like paragraphs, headings, lists, etc.
 */
export type ADFBlockNode =
  | ADFParagraph
  | ADFHeading
  | ADFBulletList
  | ADFOrderedList
  | ADFTaskList
  | ADFCodeBlock
  | ADFBlockQuote
  | ADFRule
  | ADFPanel
  | ADFTable;

/**
 * Inline nodes that can appear within block nodes.
 * These contain the actual content like text, links, emojis, etc.
 */
export type ADFInlineNode = ADFText | ADFHardBreak | ADFInlineCard | ADFMention | ADFEmoji;

/**
 * A paragraph node containing inline content.
 */
export interface ADFParagraph {
  readonly type: 'paragraph';
  readonly content?: ReadonlyArray<ADFInlineNode>;
}

/**
 * A heading node with configurable level (1-6).
 *
 * @remarks
 * Headings are not supported in all Jira issue types.
 * Use the `comment` or `task` presets to convert headings to bold text.
 */
export interface ADFHeading {
  readonly type: 'heading';
  readonly attrs: {
    readonly level: 1 | 2 | 3 | 4 | 5 | 6;
  };
  readonly content: ReadonlyArray<ADFInlineNode>;
}

/**
 * An unordered (bullet) list.
 */
export interface ADFBulletList {
  readonly type: 'bulletList';
  readonly content: ReadonlyArray<ADFListItem>;
}

/**
 * An ordered (numbered) list.
 */
export interface ADFOrderedList {
  readonly type: 'orderedList';
  readonly content: ReadonlyArray<ADFListItem>;
}

/**
 * A task list (checkbox list).
 */
export interface ADFTaskList {
  readonly type: 'taskList';
  readonly attrs: {
    readonly localId: string;
  };
  readonly content: ReadonlyArray<ADFTaskItem>;
}

/**
 * A task list item with checkbox state.
 */
export interface ADFTaskItem {
  readonly type: 'taskItem';
  readonly attrs: {
    readonly localId: string;
    readonly state: 'TODO' | 'DONE';
  };
  readonly content: ReadonlyArray<ADFInlineNode>;
}

/**
 * A list item that can contain paragraphs or nested lists.
 */
export interface ADFListItem {
  readonly type: 'listItem';
  readonly content: ReadonlyArray<ADFParagraph | ADFBulletList | ADFOrderedList>;
}

/**
 * A code block with optional syntax highlighting.
 */
export interface ADFCodeBlock {
  readonly type: 'codeBlock';
  readonly attrs?: {
    readonly language?: string;
  };
  readonly content: ReadonlyArray<ADFText>;
}

/**
 * A block quote containing other block nodes.
 */
export interface ADFBlockQuote {
  readonly type: 'blockQuote';
  readonly content: ReadonlyArray<ADFBlockNode>;
}

/**
 * A horizontal rule (divider).
 */
export interface ADFRule {
  readonly type: 'rule';
}

/**
 * A panel (callout) with different styles.
 */
export interface ADFPanel {
  readonly type: 'panel';
  readonly attrs: {
    readonly panelType: 'info' | 'note' | 'warning' | 'error' | 'success';
  };
  readonly content: ReadonlyArray<ADFBlockNode>;
}

/**
 * Text content with optional formatting marks.
 */
export interface ADFText {
  readonly type: 'text';
  readonly text: string;
  readonly marks?: ReadonlyArray<ADFMark>;
}

/**
 * A hard line break (like Shift+Enter).
 */
export interface ADFHardBreak {
  readonly type: 'hardBreak';
}

/**
 * An inline card (preview of a URL).
 */
export interface ADFInlineCard {
  readonly type: 'inlineCard';
  readonly attrs: {
    readonly url: string;
  };
}

/**
 * A mention of a user or entity.
 */
export interface ADFMention {
  readonly type: 'mention';
  readonly attrs: {
    readonly id: string;
    readonly text?: string;
  };
}

/**
 * An emoji reference.
 */
export interface ADFEmoji {
  readonly type: 'emoji';
  readonly attrs: {
    readonly shortName: string;
    readonly id?: string;
    readonly text?: string;
  };
}

/**
 * Text formatting marks that can be applied to text nodes.
 */
export type ADFMark =
  | ADFStrongMark
  | ADFEmMark
  | ADFCodeMark
  | ADFStrikeMark
  | ADFUnderlineMark
  | ADFLinkMark
  | ADFTextColorMark;

/**
 * Bold text formatting.
 */
export interface ADFStrongMark {
  readonly type: 'strong';
}

/**
 * Italic text formatting.
 */
export interface ADFEmMark {
  readonly type: 'em';
}

/**
 * Inline code formatting.
 */
export interface ADFCodeMark {
  readonly type: 'code';
}

/**
 * Strikethrough text formatting.
 */
export interface ADFStrikeMark {
  readonly type: 'strike';
}

/**
 * Underlined text formatting.
 */
export interface ADFUnderlineMark {
  readonly type: 'underline';
}

/**
 * Hyperlink with URL and optional title.
 */
export interface ADFLinkMark {
  readonly type: 'link';
  readonly attrs: {
    readonly href: string;
    readonly title?: string;
  };
}

/**
 * Text color formatting.
 */
export interface ADFTextColorMark {
  readonly type: 'textColor';
  readonly attrs: {
    readonly color: string;
  };
}

/**
 * A table node containing rows.
 */
export interface ADFTable {
  readonly type: 'table';
  readonly attrs?: {
    readonly isNumberColumnEnabled?: boolean;
    readonly layout?: 'default' | 'wide' | 'full-width';
  };
  readonly content: ReadonlyArray<ADFTableRow>;
}

/**
 * A table row containing cells.
 */
export interface ADFTableRow {
  readonly type: 'tableRow';
  readonly content: ReadonlyArray<ADFTableCell | ADFTableHeader>;
}

/**
 * A table header cell.
 */
export interface ADFTableHeader {
  readonly type: 'tableHeader';
  readonly attrs?: Record<string, unknown>;
  readonly content: ReadonlyArray<ADFParagraph>;
}

/**
 * A table data cell.
 */
export interface ADFTableCell {
  readonly type: 'tableCell';
  readonly attrs?: Record<string, unknown>;
  readonly content: ReadonlyArray<ADFParagraph>;
}
