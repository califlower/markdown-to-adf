/**
 * Unit tests for markdown to ADF conversion.
 */

import { describe, test, expect } from 'bun:test';
import { markdownToAdf, markdownToAdfWithWarnings } from '../../src/index.js';

describe('markdownToAdf', () => {
  describe('basic paragraphs', () => {
    test('converts simple text to paragraph', () => {
      const result = markdownToAdf('Hello world');

      expect(result).toEqual({
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      });
    });

    test('converts empty string to empty paragraph', () => {
      const result = markdownToAdf('');

      expect(result).toEqual({
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph' }],
      });
    });

    test('converts multiple paragraphs', () => {
      const result = markdownToAdf('First paragraph\n\nSecond paragraph');

      expect(result.content).toHaveLength(2);
      expect(result.content[0]?.type).toBe('paragraph');
      expect(result.content[1]?.type).toBe('paragraph');
    });
  });

  describe('inline formatting', () => {
    test('converts bold text', () => {
      const result = markdownToAdf('**bold text**');

      expect(result.content[0]).toEqual({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'bold text',
            marks: [{ type: 'strong' }],
          },
        ],
      });
    });

    test('converts italic text with asterisks', () => {
      const result = markdownToAdf('*italic text*');

      expect(result.content[0]).toEqual({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'italic text',
            marks: [{ type: 'em' }],
          },
        ],
      });
    });

    test('converts italic text with underscores', () => {
      const result = markdownToAdf('_italic text_');

      expect(result.content[0]).toEqual({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'italic text',
            marks: [{ type: 'em' }],
          },
        ],
      });
    });

    test('converts inline code', () => {
      const result = markdownToAdf('`code text`');

      expect(result.content[0]).toEqual({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'code text',
            marks: [{ type: 'code' }],
          },
        ],
      });
    });

    test('converts strikethrough', () => {
      const result = markdownToAdf('~~strike text~~');

      expect(result.content[0]).toEqual({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'strike text',
            marks: [{ type: 'strike' }],
          },
        ],
      });
    });

    test('converts links', () => {
      const result = markdownToAdf('[link text](https://example.com)');

      expect(result.content[0]).toEqual({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'link text',
            marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
          },
        ],
      });
    });

    test('converts links with title', () => {
      const result = markdownToAdf('[link](https://example.com "Title")');

      expect(result.content[0]).toEqual({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'link',
            marks: [
              {
                type: 'link',
                attrs: { href: 'https://example.com', title: 'Title' },
              },
            ],
          },
        ],
      });
    });

    test('converts mixed inline formatting', () => {
      const result = markdownToAdf('Text with **bold** and *italic* and `code`');

      expect(result.content[0]?.type).toBe('paragraph');
      const content = result.content[0]?.content;
      expect(content).toBeDefined();
      expect(content!.length).toBeGreaterThan(3);
    });

    test('supports nested inline formatting', () => {
      const result = markdownToAdf('***bold italic***');

      const node = result.content[0]?.content?.[0];
      expect(node?.type).toBe('text');
      expect(node?.marks?.some((mark) => mark.type === 'strong')).toBe(true);
      expect(node?.marks?.some((mark) => mark.type === 'em')).toBe(true);
    });
  });

  describe('headings', () => {
    test('converts headings to bold by default', () => {
      const result = markdownToAdf('## Heading');

      expect(result.content[0]).toEqual({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Heading',
            marks: [{ type: 'strong' }],
          },
        ],
      });
    });

    test('converts headings when useHeadings is true', () => {
      const result = markdownToAdf('## Heading', { useHeadings: true });

      expect(result.content[0]).toEqual({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Heading' }],
      });
    });

    test('respects maxHeadingLevel', () => {
      const result = markdownToAdf('#### H4', {
        useHeadings: true,
        maxHeadingLevel: 3,
      });

      // Should convert to bold paragraph since level 4 > maxHeadingLevel 3
      expect(result.content[0]?.type).toBe('paragraph');
    });
  });

  describe('lists', () => {
    test('converts bullet list', () => {
      const result = markdownToAdf('- Item 1\n- Item 2\n- Item 3');

      expect(result.content[0]).toEqual({
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Item 1' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Item 2' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Item 3' }],
              },
            ],
          },
        ],
      });
    });

    test('converts ordered list', () => {
      const result = markdownToAdf('1. First\n2. Second\n3. Third');

      expect(result.content[0]?.type).toBe('orderedList');
      expect(result.content[0]?.content).toHaveLength(3);
    });

    test('converts list with asterisk bullets', () => {
      const result = markdownToAdf('* Item 1\n* Item 2');

      expect(result.content[0]?.type).toBe('bulletList');
      expect(result.content[0]?.content).toHaveLength(2);
    });

    test('supports nested lists', () => {
      const markdown = '- Item 1\n  - Nested 1\n  - Nested 2';
      const result = markdownToAdf(markdown);

      const list = result.content[0];
      expect(list?.type).toBe('bulletList');
      const firstItem = list?.content[0];
      expect(firstItem?.content.some((node) => node.type === 'bulletList')).toBe(true);
    });
  });

  describe('task lists', () => {
    test('converts unchecked task items', () => {
      const result = markdownToAdf('- [ ] Unchecked task');

      expect(result.content[0]?.type).toBe('taskList');
      const taskList = result.content[0];
      expect(taskList?.attrs?.localId).toBeDefined();
      expect(taskList?.content).toHaveLength(1);

      const taskItem = taskList?.content[0];
      expect(taskItem?.type).toBe('taskItem');
      expect(taskItem?.attrs?.state).toBe('TODO');
      expect(taskItem?.attrs?.localId).toBeDefined();
      expect(taskItem?.content).toEqual([{ type: 'text', text: 'Unchecked task' }]);
    });

    test('converts checked task items with lowercase x', () => {
      const result = markdownToAdf('- [x] Checked task');

      const taskList = result.content[0];
      const taskItem = taskList?.content[0];
      expect(taskItem?.attrs?.state).toBe('DONE');
    });

    test('converts checked task items with uppercase X', () => {
      const result = markdownToAdf('- [X] Checked task');

      const taskList = result.content[0];
      const taskItem = taskList?.content[0];
      expect(taskItem?.attrs?.state).toBe('DONE');
    });

    test('converts multiple task items', () => {
      const markdown = '- [ ] Task 1\n- [x] Task 2\n- [ ] Task 3';
      const result = markdownToAdf(markdown);

      const taskList = result.content[0];
      expect(taskList?.type).toBe('taskList');
      expect(taskList?.content).toHaveLength(3);

      expect(taskList?.content[0]?.attrs?.state).toBe('TODO');
      expect(taskList?.content[1]?.attrs?.state).toBe('DONE');
      expect(taskList?.content[2]?.attrs?.state).toBe('TODO');
    });

    test('task items can have inline formatting', () => {
      const result = markdownToAdf('- [ ] Task with **bold** and `code`');

      const taskList = result.content[0];
      const taskItem = taskList?.content[0];
      expect(taskItem?.content.length).toBeGreaterThan(1);
      expect(taskItem?.content.some((node) => node.marks?.[0]?.type === 'strong')).toBe(true);
      expect(taskItem?.content.some((node) => node.marks?.[0]?.type === 'code')).toBe(true);
    });

    test('distinguishes task lists from regular bullet lists', () => {
      const markdown = '- [ ] Task item\n- Regular item';
      const result = markdownToAdf(markdown);

      // Should create two separate lists
      expect(result.content).toHaveLength(2);
      expect(result.content[0]?.type).toBe('taskList');
      expect(result.content[1]?.type).toBe('bulletList');
    });
  });

  describe('code blocks', () => {
    test('converts code block without language', () => {
      const markdown = '```\nconst x = 1;\n```';
      const result = markdownToAdf(markdown);

      expect(result.content[0]).toEqual({
        type: 'codeBlock',
        attrs: { language: 'text' },
        content: [{ type: 'text', text: 'const x = 1;' }],
      });
    });

    test('converts code block with language', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const result = markdownToAdf(markdown);

      expect(result.content[0]).toEqual({
        type: 'codeBlock',
        attrs: { language: 'javascript' },
        content: [{ type: 'text', text: 'const x = 1;' }],
      });
    });

    test('converts multiline code block', () => {
      const markdown = '```python\ndef hello():\n    print("Hello")\n```';
      const result = markdownToAdf(markdown);

      expect(result.content[0]?.type).toBe('codeBlock');
      expect(result.content[0]?.content[0]?.text).toContain('def hello()');
    });
  });

  describe('block quotes', () => {
    test('converts simple block quote', () => {
      const result = markdownToAdf('> This is a quote');

      expect(result.content[0]?.type).toBe('blockQuote');
    });

    test('converts multiline block quote', () => {
      const result = markdownToAdf('> Line 1\n> Line 2');

      expect(result.content[0]?.type).toBe('blockQuote');
    });
  });

  describe('line breaks', () => {
    test('preserves line breaks when enabled', () => {
      const result = markdownToAdf('Line 1\nLine 2', { preserveLineBreaks: true });
      const content = result.content[0]?.content;
      expect(content?.some((node) => node.type === 'hardBreak')).toBe(true);
    });
  });

  describe('presets', () => {
    test('comment preset converts headings to bold', () => {
      const result = markdownToAdf('## Heading', { preset: 'comment' });

      expect(result.content[0]?.type).toBe('paragraph');
      expect(result.content[0]?.content[0]?.marks?.[0]?.type).toBe('strong');
    });

    test('task preset converts headings to bold', () => {
      const result = markdownToAdf('## Heading', { preset: 'task' });

      expect(result.content[0]?.type).toBe('paragraph');
    });

    test('story preset uses actual headings', () => {
      const result = markdownToAdf('## Heading', { preset: 'story' });

      expect(result.content[0]?.type).toBe('heading');
    });
  });

  describe('warnings and strict mode', () => {
    test('returns warnings when requested', () => {
      const result = markdownToAdfWithWarnings('Hello world');
      expect(result.adf.type).toBe('doc');
      expect(result.warnings).toHaveLength(0);
    });

    test('warns on risky nodes when enabled', () => {
      const markdown = `| Header | Value |
|--------|-------|
| A | B |`;
      const result = markdownToAdfWithWarnings(markdown, { preset: 'comment' });
      expect(result.warnings.some((warning) => warning.type === 'risky_feature')).toBe(true);
    });

    test('warns on lossy heading conversion', () => {
      const result = markdownToAdfWithWarnings('## Heading', { preset: 'comment' });
      expect(result.warnings.some((warning) => warning.type === 'lossy_conversion')).toBe(true);
    });

    test('strict mode throws on incompatible heading', () => {
      expect(() => markdownToAdf('## Heading', { preset: 'comment', strictMode: true })).toThrow();
    });

    test('strict mode throws when heading exceeds max level', () => {
      expect(() =>
        markdownToAdf('#### Heading', {
          preset: 'story',
          useHeadings: true,
          maxHeadingLevel: 2,
          strictMode: true,
        }),
      ).toThrow();
    });
  });

  describe('tables', () => {
    test('converts simple table', () => {
      const markdown = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |`;

      const result = markdownToAdf(markdown);

      expect(result.content[0]?.type).toBe('table');
      const tableNode = result.content[0];
      expect(tableNode?.content).toHaveLength(3); // 1 header row + 2 data rows

      // Check header row
      const headerRow = tableNode?.content[0];
      expect(headerRow?.content[0]?.type).toBe('tableHeader');
      expect(headerRow?.content[1]?.type).toBe('tableHeader');

      // Check data rows
      const dataRow = tableNode?.content[1];
      expect(dataRow?.content[0]?.type).toBe('tableCell');
      expect(dataRow?.content[1]?.type).toBe('tableCell');
    });

    test('tables support inline formatting', () => {
      const markdown = `| Header | Value |
|--------|-------|
| **Bold** | \`code\` |
| *Italic* | [link](http://example.com) |`;

      const result = markdownToAdf(markdown);

      const tableNode = result.content[0];
      expect(tableNode?.type).toBe('table');

      // Check that cells have inline formatting
      const firstDataRow = tableNode?.content[1];
      const firstCell = firstDataRow?.content[0]?.content[0]?.content;
      expect(firstCell?.some((node) => node.marks?.[0]?.type === 'strong')).toBe(true);

      const secondCell = firstDataRow?.content[1]?.content[0]?.content;
      expect(secondCell?.some((node) => node.marks?.[0]?.type === 'code')).toBe(true);
    });
  });

  describe('complex documents', () => {
    test('converts mixed content document', () => {
      const markdown = `# Title

This is a **paragraph** with *formatting*.

## Features
- Item 1
- Item 2

\`\`\`javascript
const x = 1;
\`\`\`

> A quote`;

      const result = markdownToAdf(markdown, { preset: 'story' });

      expect(result.content.length).toBeGreaterThan(4);
      expect(result.content.some((node) => node.type === 'heading')).toBe(true);
      expect(result.content.some((node) => node.type === 'bulletList')).toBe(true);
      expect(result.content.some((node) => node.type === 'codeBlock')).toBe(true);
      expect(result.content.some((node) => node.type === 'blockQuote')).toBe(true);
    });
  });
});
