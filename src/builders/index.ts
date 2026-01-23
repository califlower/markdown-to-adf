/**
 * ADF node and mark builder functions.
 *
 * @remarks
 * These are pure functions that create properly-typed ADF nodes.
 * They can be used to manually construct ADF documents if needed.
 *
 * @example
 * ```ts
 * import { doc, paragraph, text, strong } from 'markdown-to-adf/builders';
 *
 * const adf = doc([
 *   paragraph([
 *     text('Hello '),
 *     text('world', [strong()]),
 *   ]),
 * ]);
 * ```
 */

export {
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
  rule,
  text,
  hardBreak,
  table,
  tableRow,
  tableHeader,
  tableCell,
} from './nodes.js';

export {
  strong,
  em,
  code,
  strike,
  underline,
  link,
} from './marks.js';
