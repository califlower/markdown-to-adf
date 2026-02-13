/**
 * Block-level markdown-it token parsing for ADF conversion.
 */

import type { Token } from 'markdown-it';
import type {
  ADFBlockNode,
  ADFParagraph,
  ADFInlineNode,
  ADFListItem,
  ADFTaskItem,
} from '../types/adf.js';
import type { ConversionOptions, ConversionWarning, ContextPreset } from '../types/options.js';
import {
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
} from '../builders/index.js';
import { strong } from '../builders/marks.js';
import { parseInlineTokens } from '../utils/inline-parser.js';

interface BlockParseContext {
  options: Required<Omit<ConversionOptions, 'preset'>>;
  preset: ContextPreset;
  warnings: ConversionWarning[];
}

export class BlockParser {
  private readonly options: Required<Omit<ConversionOptions, 'preset'>>;
  private readonly preset: ContextPreset;
  private readonly warnings: ConversionWarning[];

  constructor(context: BlockParseContext) {
    this.options = context.options;
    this.preset = context.preset;
    this.warnings = context.warnings;
  }

  parse(tokens: readonly Token[]): ADFBlockNode[] {
    return this.parseBlockTokens(tokens, 0, undefined).nodes;
  }

  private parseBlockTokens(
    tokens: readonly Token[],
    startIndex: number,
    endType: string | undefined,
  ): { nodes: ADFBlockNode[]; nextIndex: number } {
    const nodes: ADFBlockNode[] = [];
    let i = startIndex;

    while (i < tokens.length) {
      const token = tokens[i]!;
      if (endType && token.type === endType) {
        return { nodes, nextIndex: i + 1 };
      }

      switch (token.type) {
        case 'paragraph_open': {
          const inlineToken = tokens[i + 1];
          const inline = this.parseInline(inlineToken);
          nodes.push(inline.length > 0 ? paragraph(inline) : paragraph());
          i += 3;
          break;
        }
        case 'heading_open': {
          const level = this.getHeadingLevel(token.tag);
          const inlineToken = tokens[i + 1];
          const inline = this.parseInline(inlineToken);
          const presetAllowsHeadings = this.preset === 'story' || this.preset === 'default';
          const exceedsMaxLevel = level > this.options.maxHeadingLevel;
          const canUseHeading =
            presetAllowsHeadings && this.options.useHeadings && !exceedsMaxLevel;

          if (canUseHeading) {
            nodes.push(heading(level, inline.length > 0 ? inline : [text('')]));
          } else {
            const incompatibleWithPreset = !presetAllowsHeadings;
            const incompatibleWithMax = this.options.useHeadings && exceedsMaxLevel;
            const shouldThrow =
              this.options.strictMode && (incompatibleWithPreset || incompatibleWithMax);
            const reason = incompatibleWithPreset
              ? `Headings are not supported in the ${this.preset} context`
              : `Heading level ${level} exceeds maxHeadingLevel ${this.options.maxHeadingLevel}`;

            if (shouldThrow) {
              throw this.createError(
                'unsupported_feature',
                reason,
                this.getLine(token),
                token.content,
              );
            }
            if (incompatibleWithPreset || incompatibleWithMax) {
              this.addWarning(
                'lossy_conversion',
                `${reason}; converting to bold text`,
                this.getLine(token),
                token.content,
              );
            }
            nodes.push(paragraph(this.applyMarkToInline(inline, strong())));
          }
          i += 3;
          break;
        }
        case 'bullet_list_open': {
          const result = this.parseList(tokens, i, 'bullet');
          nodes.push(...result.nodes);
          i = result.nextIndex;
          break;
        }
        case 'ordered_list_open': {
          const result = this.parseList(tokens, i, 'ordered');
          nodes.push(...result.nodes);
          i = result.nextIndex;
          break;
        }
        case 'blockquote_open': {
          const result = this.parseBlockQuote(tokens, i);
          nodes.push(...result.nodes);
          i = result.nextIndex;
          break;
        }
        case 'fence':
        case 'code_block': {
          nodes.push(this.parseCodeBlockToken(token));
          i += 1;
          break;
        }
        case 'table_open': {
          const result = this.parseTable(tokens, i);
          this.warnIfRisky('table', this.getLine(token));
          nodes.push(result.node);
          i = result.nextIndex;
          break;
        }
        case 'hr': {
          if (this.options.strictMode) {
            throw this.createError(
              'unsupported_feature',
              'Horizontal rules are not supported in this context',
              this.getLine(token),
              token.content,
            );
          }
          this.addWarning(
            'unsupported_feature',
            'Horizontal rules are not supported in this context',
            this.getLine(token),
            token.content,
          );
          i += 1;
          break;
        }
        case 'inline': {
          const inline = this.parseInline(token);
          nodes.push(inline.length > 0 ? paragraph(inline) : paragraph());
          i += 1;
          break;
        }
        default: {
          i += 1;
          break;
        }
      }
    }

    return { nodes, nextIndex: i };
  }

  private parseCodeBlockToken(token: Token): ADFBlockNode {
    const language = token.info?.trim() || this.options.defaultCodeLanguage;
    const content = token.content.replace(/\n$/, '');
    return codeBlock(content, language);
  }

  private parseList(
    tokens: readonly Token[],
    startIndex: number,
    listType: 'bullet' | 'ordered',
  ): { nodes: ADFBlockNode[]; nextIndex: number } {
    const closeType = listType === 'bullet' ? 'bullet_list_close' : 'ordered_list_close';
    let i = startIndex + 1;

    type Segment =
      | { type: 'task'; items: ADFTaskItem[] }
      | { type: 'regular'; items: ADFListItem[] };
    const segments: Segment[] = [];

    const pushSegment = (segment: Segment): void => {
      if (segment.items.length === 0) return;
      segments.push(segment);
    };

    let currentSegment: Segment | null = null;

    while (i < tokens.length && tokens[i]!.type !== closeType) {
      if (tokens[i]!.type === 'list_item_open') {
        const isTaskItem = listType === 'bullet' && this.isTaskListItem(tokens, i);
        const segmentType: Segment['type'] = isTaskItem ? 'task' : 'regular';

        if (!currentSegment || currentSegment.type !== segmentType) {
          if (currentSegment) pushSegment(currentSegment);
          currentSegment =
            segmentType === 'task' ? { type: 'task', items: [] } : { type: 'regular', items: [] };
        }

        const result = this.parseListItem(tokens, i, isTaskItem);
        if (currentSegment.type === 'task') {
          currentSegment.items.push(result.taskItem);
        } else {
          currentSegment.items.push(result.listItem);
        }
        i = result.nextIndex;
      } else {
        i += 1;
      }
    }

    if (currentSegment) pushSegment(currentSegment);

    const nodes: ADFBlockNode[] = segments.map((segment) => {
      if (segment.type === 'task') {
        return taskList(segment.items);
      }
      return listType === 'bullet' ? bulletList(segment.items) : orderedList(segment.items);
    });

    return { nodes, nextIndex: i + 1 };
  }

  private parseListItem(
    tokens: readonly Token[],
    startIndex: number,
    asTask: boolean,
  ): { listItem: ADFListItem; taskItem: ADFTaskItem; nextIndex: number } {
    let i = startIndex + 1;
    const blocks: ADFBlockNode[] = [];
    let taskChecked = false;
    let taskContent: ADFInlineNode[] = [];

    while (i < tokens.length && tokens[i]!.type !== 'list_item_close') {
      const token = tokens[i]!;
      switch (token.type) {
        case 'paragraph_open': {
          const inlineToken = tokens[i + 1];
          const inlineResult = parseInlineTokens(inlineToken?.children, {
            preserveLineBreaks: this.options.preserveLineBreaks,
            stripTaskCheckbox: asTask,
          });
          if (asTask && taskContent.length === 0) {
            taskContent = this.trimLeadingSpace(inlineResult.nodes);
            taskChecked = inlineResult.taskChecked;
          } else {
            blocks.push(
              inlineResult.nodes.length > 0 ? paragraph(inlineResult.nodes) : paragraph(),
            );
          }
          i += 3;
          break;
        }
        case 'bullet_list_open': {
          const result = this.parseList(tokens, i, 'bullet');
          blocks.push(...result.nodes);
          i = result.nextIndex;
          break;
        }
        case 'ordered_list_open': {
          const result = this.parseList(tokens, i, 'ordered');
          blocks.push(...result.nodes);
          i = result.nextIndex;
          break;
        }
        case 'blockquote_open': {
          const result = this.parseBlockQuote(tokens, i);
          blocks.push(...result.nodes);
          i = result.nextIndex;
          break;
        }
        case 'fence':
        case 'code_block': {
          blocks.push(this.parseCodeBlockToken(token));
          i += 1;
          break;
        }
        case 'table_open': {
          const result = this.parseTable(tokens, i);
          this.warnIfRisky('table', this.getLine(token));
          blocks.push(result.node);
          i = result.nextIndex;
          break;
        }
        case 'inline': {
          const inlineResult = parseInlineTokens(token.children, {
            preserveLineBreaks: this.options.preserveLineBreaks,
            stripTaskCheckbox: asTask,
          });
          if (asTask && taskContent.length === 0) {
            taskContent = this.trimLeadingSpace(inlineResult.nodes);
            taskChecked = inlineResult.taskChecked;
          } else {
            blocks.push(
              inlineResult.nodes.length > 0 ? paragraph(inlineResult.nodes) : paragraph(),
            );
          }
          i += 1;
          break;
        }
        case 'hr': {
          if (this.options.strictMode) {
            throw this.createError(
              'unsupported_feature',
              'Horizontal rules are not supported in this context',
              this.getLine(token),
              token.content,
            );
          }
          this.addWarning(
            'unsupported_feature',
            'Horizontal rules are not supported in this context',
            this.getLine(token),
            token.content,
          );
          i += 1;
          break;
        }
        default: {
          i += 1;
          break;
        }
      }
    }

    const nextIndex = i + 1;

    if (asTask) {
      if (blocks.length > 0) {
        this.addWarning(
          'lossy_conversion',
          'Task list items only support inline content; extra blocks were dropped',
          this.getLine(tokens[startIndex]!),
        );
      }
      return {
        listItem: listItem([paragraph(taskContent)]),
        taskItem: taskItem(taskContent, taskChecked),
        nextIndex,
      };
    }

    const allowed = blocks.filter(
      (block) =>
        block.type === 'paragraph' || block.type === 'bulletList' || block.type === 'orderedList',
    ) as Array<ADFParagraph | ReturnType<typeof bulletList> | ReturnType<typeof orderedList>>;

    if (allowed.length !== blocks.length) {
      this.addWarning(
        'lossy_conversion',
        'List items only support paragraphs and nested lists; unsupported blocks were dropped',
        this.getLine(tokens[startIndex]!),
      );
    }

    if (allowed.length === 0) {
      allowed.push(paragraph());
    }

    return {
      listItem: listItem(allowed),
      taskItem: taskItem(taskContent, taskChecked),
      nextIndex,
    };
  }

  private parseBlockQuote(
    tokens: readonly Token[],
    startIndex: number,
  ): { nodes: ADFBlockNode[]; nextIndex: number } {
    const result = this.parseBlockTokens(tokens, startIndex + 1, 'blockquote_close');
    if (this.preset === 'comment') {
      this.addWarning(
        'lossy_conversion',
        'Block quotes are not supported in comments; converting to paragraphs',
        this.getLine(tokens[startIndex]!),
      );
      return {
        nodes: result.nodes.length > 0 ? result.nodes : [paragraph()],
        nextIndex: result.nextIndex,
      };
    }
    return { nodes: [blockQuote(result.nodes)], nextIndex: result.nextIndex };
  }

  private parseTable(
    tokens: readonly Token[],
    startIndex: number,
  ): { node: ADFBlockNode; nextIndex: number } {
    let i = startIndex + 1;
    const rows: Array<ReturnType<typeof tableRow>> = [];

    while (i < tokens.length && tokens[i]!.type !== 'table_close') {
      const sectionToken = tokens[i]!;
      if (sectionToken.type === 'thead_open' || sectionToken.type === 'tbody_open') {
        const sectionClose = sectionToken.type === 'thead_open' ? 'thead_close' : 'tbody_close';
        const isHeader = sectionToken.type === 'thead_open';
        i += 1;
        while (i < tokens.length && tokens[i]!.type !== sectionClose) {
          if (tokens[i]!.type === 'tr_open') {
            const rowCells: Array<ReturnType<typeof tableHeader> | ReturnType<typeof tableCell>> =
              [];
            i += 1;
            while (i < tokens.length && tokens[i]!.type !== 'tr_close') {
              if (tokens[i]!.type === 'th_open' || tokens[i]!.type === 'td_open') {
                const isHeaderCell = tokens[i]!.type === 'th_open' || isHeader;
                const inlineToken = tokens[i + 1];
                const inline = this.parseInline(inlineToken);
                const cellContent = [inline.length > 0 ? paragraph(inline) : paragraph()];
                rowCells.push(isHeaderCell ? tableHeader(cellContent) : tableCell(cellContent));
                i += 3;
              } else {
                i += 1;
              }
            }
            rows.push(tableRow(rowCells));
            i += 1;
          } else {
            i += 1;
          }
        }
        i += 1;
      } else {
        i += 1;
      }
    }

    return {
      node: table(rows, { isNumberColumnEnabled: false, layout: 'default' }),
      nextIndex: i + 1,
    };
  }

  private parseInline(token: Token | undefined): ADFInlineNode[] {
    return parseInlineTokens(token?.children ?? undefined, {
      preserveLineBreaks: this.options.preserveLineBreaks,
    }).nodes;
  }

  private applyMarkToInline(
    nodes: readonly ADFInlineNode[],
    mark: ReturnType<typeof strong>,
  ): ADFInlineNode[] {
    if (nodes.length === 0) {
      return [text('', [mark])];
    }
    return nodes.map((node) => {
      if (node.type !== 'text') return node;
      const marks = node.marks ? [...node.marks, mark] : [mark];
      return text(node.text, marks);
    });
  }

  private trimLeadingSpace(nodes: readonly ADFInlineNode[]): ADFInlineNode[] {
    if (nodes.length === 0) return [...nodes];
    const first = nodes[0];
    if (!first || first.type !== 'text') return [...nodes];
    if (!first.text.startsWith(' ')) return [...nodes];
    const trimmed = first.text.replace(/^\s+/, '');
    if (trimmed === '') {
      return nodes.slice(1);
    }
    return [text(trimmed, first.marks), ...nodes.slice(1)];
  }

  private getHeadingLevel(tag: string): 1 | 2 | 3 | 4 | 5 | 6 {
    const level = Number(tag.replace('h', ''));
    if (level >= 1 && level <= 6) return level as 1 | 2 | 3 | 4 | 5 | 6;
    return 1;
  }

  private warnIfRisky(nodeType: 'table', line?: number): void {
    if (!this.options.warnOnRiskyNodes) return;
    if (nodeType === 'table' && this.preset === 'comment') {
      this.addWarning(
        'risky_feature',
        'Tables in comments are supported but can be inconsistent in some Jira views',
        line,
      );
    }
  }

  private isTaskListItem(tokens: readonly Token[], startIndex: number): boolean {
    const openToken = tokens[startIndex]!;
    if (this.hasTaskItemClass(openToken)) return true;

    let i = startIndex + 1;
    while (i < tokens.length && tokens[i]!.type !== 'list_item_close') {
      const token = tokens[i]!;
      if (token.type === 'inline' && this.inlineHasTaskCheckbox(token)) {
        return true;
      }
      i += 1;
    }
    return false;
  }

  private hasTaskItemClass(token: Token): boolean {
    const classAttr = this.getAttr(token, 'class');
    if (!classAttr) return false;
    return classAttr.split(/\s+/).includes('task-list-item');
  }

  private inlineHasTaskCheckbox(token: Token): boolean {
    if (!token.children) return false;
    return token.children.some(
      (child) => child.type === 'html_inline' && /type=["']checkbox["']/i.test(child.content),
    );
  }

  private addWarning(
    type: ConversionWarning['type'],
    message: string,
    line?: number,
    markdown?: string,
  ): void {
    const warning: ConversionWarning = { type, message };
    if (line !== undefined) warning.line = line;
    if (markdown !== undefined) warning.markdown = markdown;
    this.warnings.push(warning);
  }

  private createError(
    type: ConversionWarning['type'],
    message: string,
    line?: number,
    markdown?: string,
  ): Error {
    const details = line ? ` (line ${line})` : '';
    const error = new Error(`${message}${details}`);
    const conversionError: ConversionWarning = { type, message };
    if (line !== undefined) conversionError.line = line;
    if (markdown !== undefined) conversionError.markdown = markdown;
    (error as Error & { conversionError?: ConversionWarning }).conversionError = conversionError;
    return error;
  }

  private getAttr(token: Token, name: string): string | null {
    if (typeof token.attrGet === 'function') {
      return token.attrGet(name);
    }
    if (!token.attrs) return null;
    for (const attr of token.attrs) {
      if (attr[0] === name) {
        return attr[1] ?? null;
      }
    }
    return null;
  }

  private getLine(token: Token): number | undefined {
    if (!token.map) return undefined;
    return token.map[0] + 1;
  }
}
