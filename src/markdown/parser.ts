/**
 * Markdown-it parser configuration used by the converter.
 */

import MarkdownIt from 'markdown-it';
import markdownItTaskLists from 'markdown-it-task-lists';

/**
 * Creates a configured markdown-it instance for parsing markdown to tokens.
 *
 * @internal
 */
export function createMarkdownParser(): MarkdownIt {
  return new MarkdownIt({ html: false, breaks: false, linkify: true })
    .enable(['table', 'strikethrough'])
    .use(markdownItTaskLists, { enabled: true });
}
