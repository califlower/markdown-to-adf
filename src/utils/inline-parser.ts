/**
 * Utilities for parsing inline markdown formatting.
 */

import type { ADFInlineNode, ADFMark } from '../types/adf.js';
import { text } from '../builders/nodes.js';
import { strong, em, code as codeMark, strike, link } from '../builders/marks.js';

/**
 * A parsed inline token with formatting information.
 *
 * @internal
 */
interface InlineToken {
  text: string;
  marks: ADFMark[];
}

/**
 * Parses inline markdown formatting and converts to ADF inline nodes.
 *
 * Supports:
 * - **bold**
 * - *italic* or _italic_
 * - `inline code`
 * - ~~strikethrough~~
 * - [link text](url)
 *
 * @param input - The markdown text to parse
 * @returns Array of ADF inline nodes
 *
 * @internal
 */
export function parseInlineMarkdown(input: string): ADFInlineNode[] {
  if (!input) {
    return [];
  }

  const tokens: InlineToken[] = [];
  let remaining = input;
  let position = 0;

  while (position < remaining.length) {
    // Try to match each inline pattern
    const boldMatch = matchPattern(remaining, position, /^\*\*([^*]+)\*\*/);
    const italicMatch = matchPattern(remaining, position, /^\*([^*]+)\*/) ||
                       matchPattern(remaining, position, /^_([^_]+)_/);
    const codeMatch = matchPattern(remaining, position, /^`([^`]+)`/);
    const strikeMatch = matchPattern(remaining, position, /^~~([^~]+)~~/);
    const linkMatch = matchLinkPattern(remaining, position);

    if (boldMatch) {
      tokens.push({ text: boldMatch.content, marks: [strong()] });
      position += boldMatch.length;
    } else if (italicMatch) {
      tokens.push({ text: italicMatch.content, marks: [em()] });
      position += italicMatch.length;
    } else if (codeMatch) {
      tokens.push({ text: codeMatch.content, marks: [codeMark()] });
      position += codeMatch.length;
    } else if (strikeMatch) {
      tokens.push({ text: strikeMatch.content, marks: [strike()] });
      position += strikeMatch.length;
    } else if (linkMatch) {
      tokens.push({
        text: linkMatch.text,
        marks: [link(linkMatch.url, linkMatch.title)],
      });
      position += linkMatch.length;
    } else {
      // No match, add plain text character
      const char = remaining[position];
      if (char) {
        if (tokens.length > 0 && tokens[tokens.length - 1]!.marks.length === 0) {
          // Append to previous plain text token
          tokens[tokens.length - 1]!.text += char;
        } else {
          // Create new plain text token
          tokens.push({ text: char, marks: [] });
        }
      }
      position++;
    }
  }

  // Convert tokens to ADF nodes
  return tokens.map(token => text(token.text, token.marks.length > 0 ? token.marks : undefined));
}

/**
 * Match result for inline patterns.
 *
 * @internal
 */
interface MatchResult {
  content: string;
  length: number;
}

/**
 * Match result for link patterns.
 *
 * @internal
 */
interface LinkMatchResult {
  text: string;
  url: string;
  title?: string;
  length: number;
}

/**
 * Attempts to match a regex pattern at the current position.
 *
 * @param input - The full input string
 * @param position - Current position in the string
 * @param pattern - Regex pattern to match
 * @returns Match result if successful, null otherwise
 *
 * @internal
 */
function matchPattern(input: string, position: number, pattern: RegExp): MatchResult | null {
  const slice = input.slice(position);
  const match = pattern.exec(slice);

  if (!match) {
    return null;
  }

  return {
    content: match[1] ?? '',
    length: match[0].length,
  };
}

/**
 * Attempts to match a markdown link pattern: [text](url) or [text](url "title")
 *
 * @param input - The full input string
 * @param position - Current position in the string
 * @returns Link match result if successful, null otherwise
 *
 * @internal
 */
function matchLinkPattern(input: string, position: number): LinkMatchResult | null {
  const slice = input.slice(position);

  // Match: [text](url) or [text](url "title")
  const match = /^\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/.exec(slice);

  if (!match) {
    return null;
  }

  const result: LinkMatchResult = {
    text: match[1] ?? '',
    url: match[2] ?? '',
    length: match[0].length,
  };

  if (match[3] !== undefined) {
    result.title = match[3];
  }

  return result;
}
