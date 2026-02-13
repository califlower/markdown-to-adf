/**
 * Utilities for parsing inline markdown-it tokens into ADF inline nodes.
 */

import type { Token } from 'markdown-it';
import type { ADFInlineNode, ADFMark } from '../types/adf.js';
import { text, hardBreak } from '../builders/nodes.js';
import { strong, em, code as codeMark, strike, link } from '../builders/marks.js';

interface InlineParseOptions {
  preserveLineBreaks: boolean;
  stripTaskCheckbox?: boolean;
}

interface InlineParseResult {
  nodes: ADFInlineNode[];
  taskChecked: boolean;
}

export function parseInlineTokens(
  tokens: readonly Token[] | null | undefined,
  options: InlineParseOptions,
): InlineParseResult {
  if (!tokens || tokens.length === 0) {
    return { nodes: [], taskChecked: false };
  }

  const nodes: ADFInlineNode[] = [];
  const marks: ADFMark[] = [];
  let taskChecked = false;

  const pushText = (value: string, activeMarks: readonly ADFMark[]): void => {
    if (value === '') return;
    const last = nodes[nodes.length - 1];
    if (last && last.type === 'text' && areMarksEqual(last.marks, activeMarks)) {
      nodes[nodes.length - 1] = text(
        last.text + value,
        activeMarks.length > 0 ? activeMarks : undefined,
      );
      return;
    }
    nodes.push(text(value, activeMarks.length > 0 ? activeMarks : undefined));
  };

  for (const token of tokens) {
    switch (token.type) {
      case 'text': {
        pushText(token.content, marks.slice());
        break;
      }
      case 'code_inline': {
        pushText(token.content, [...marks, codeMark()]);
        break;
      }
      case 'softbreak': {
        if (options.preserveLineBreaks) {
          nodes.push(hardBreak());
        } else {
          pushText(' ', marks.slice());
        }
        break;
      }
      case 'hardbreak': {
        nodes.push(hardBreak());
        break;
      }
      case 'strong_open': {
        marks.push(strong());
        break;
      }
      case 'strong_close': {
        popMark(marks, 'strong');
        break;
      }
      case 'em_open': {
        marks.push(em());
        break;
      }
      case 'em_close': {
        popMark(marks, 'em');
        break;
      }
      case 's_open':
      case 'del_open': {
        marks.push(strike());
        break;
      }
      case 's_close':
      case 'del_close': {
        popMark(marks, 'strike');
        break;
      }
      case 'link_open': {
        const href = getAttr(token, 'href');
        const title = getAttr(token, 'title');
        if (href) {
          marks.push(link(href, title ?? undefined));
        }
        break;
      }
      case 'link_close': {
        popMark(marks, 'link');
        break;
      }
      case 'html_inline': {
        if (options.stripTaskCheckbox) {
          const checkbox = parseTaskCheckbox(token.content);
          if (checkbox.isCheckbox) {
            if (checkbox.checked) taskChecked = true;
            break;
          }
        }
        break;
      }
      case 'image': {
        const src = getAttr(token, 'src');
        const alt = token.content || getAttr(token, 'alt');
        if (src) {
          pushText(alt || src, [...marks, link(src)]);
        } else if (alt) {
          pushText(alt, marks.slice());
        }
        break;
      }
      default:
        break;
    }
  }

  return { nodes, taskChecked };
}

function popMark(marks: ADFMark[], type: ADFMark['type']): void {
  for (let i = marks.length - 1; i >= 0; i--) {
    if (marks[i]?.type === type) {
      marks.splice(i, 1);
      return;
    }
  }
}

function areMarksEqual(left: readonly ADFMark[] | undefined, right: readonly ADFMark[]): boolean {
  if (!left || left.length === 0) {
    return right.length === 0;
  }
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i++) {
    const a = left[i]!;
    const b = right[i]!;
    if (a.type !== b.type) return false;
    const aAttrs = 'attrs' in a ? a.attrs : undefined;
    const bAttrs = 'attrs' in b ? b.attrs : undefined;
    if (!shallowEqual(aAttrs, bAttrs)) return false;
  }
  return true;
}

function shallowEqual(
  left: Record<string, unknown> | undefined,
  right: Record<string, unknown> | undefined,
): boolean {
  if (!left && !right) return true;
  if (!left || !right) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  for (const key of leftKeys) {
    if (left[key] !== right[key]) return false;
  }
  return true;
}

function getAttr(token: Token, name: string): string | null {
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

function parseTaskCheckbox(html: string): { isCheckbox: boolean; checked: boolean } {
  const isCheckbox = /type=["']checkbox["']/i.test(html);
  if (!isCheckbox) {
    return { isCheckbox: false, checked: false };
  }
  const checked = /checked(=|\s|>)/i.test(html);
  return { isCheckbox: true, checked };
}
