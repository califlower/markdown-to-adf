/**
 * Pure functions for building ADF marks (inline formatting).
 */

import type {
  ADFStrongMark,
  ADFEmMark,
  ADFCodeMark,
  ADFStrikeMark,
  ADFUnderlineMark,
  ADFLinkMark,
} from '../types/adf.js';

/**
 * Creates a bold (strong) mark.
 *
 * @returns A strong mark
 */
export function strong(): ADFStrongMark {
  return { type: 'strong' };
}

/**
 * Creates an italic (emphasis) mark.
 *
 * @returns An emphasis mark
 */
export function em(): ADFEmMark {
  return { type: 'em' };
}

/**
 * Creates an inline code mark.
 *
 * @returns A code mark
 */
export function code(): ADFCodeMark {
  return { type: 'code' };
}

/**
 * Creates a strikethrough mark.
 *
 * @returns A strike mark
 */
export function strike(): ADFStrikeMark {
  return { type: 'strike' };
}

/**
 * Creates an underline mark.
 *
 * @returns An underline mark
 */
export function underline(): ADFUnderlineMark {
  return { type: 'underline' };
}

/**
 * Creates a hyperlink mark.
 *
 * @param href - The URL to link to
 * @param title - Optional link title
 * @returns A link mark
 */
export function link(href: string, title?: string): ADFLinkMark {
  return title
    ? { type: 'link', attrs: { href, title } }
    : { type: 'link', attrs: { href } };
}
