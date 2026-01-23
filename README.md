# markdown-to-adf

Convert Markdown to Atlassian Document Format (ADF) with context-aware presets for Jira.

Built from production experience: this library handles the nuances of ADF support across different Jira contexts, preventing the "INVALID_INPUT" errors that plague manual ADF generation.

## Installation

### From npm (Coming Soon)

```bash
npm install markdown-to-adf
```

*Note: This package is not yet published to npm. See "Install from Source" below.*

### Install from Source

```bash
# Clone the repository
git clone https://github.com/califlower/markdown-to-adf.git
cd markdown-to-adf

# Install dependencies
npm install

# Build the library
npm run build
```

### Use as a Git Dependency

Until this package is published to npm, you can reference it directly in your `package.json`:

```json
{
  "dependencies": {
    "markdown-to-adf": "git+https://github.com/califlower/markdown-to-adf.git#v0.1.0"
  }
}
```

Then run `npm install`.

## Quick Start

```typescript
import { markdownToAdf } from 'markdown-to-adf';

// Basic usage
const adf = markdownToAdf('## Hello\n- Item 1\n- Item 2');

// Context-specific presets
const adf = markdownToAdf(markdown, { preset: 'comment' }); // For issue comments
const adf = markdownToAdf(markdown, { preset: 'task' });    // For Task issues
const adf = markdownToAdf(markdown, { preset: 'story' });   // For Story/Epic issues
```

## Features

- **Type-safe**: Full TypeScript support with comprehensive types
- **Context-aware**: Presets optimized for different Jira contexts
- **Zero dependencies**: Pure TypeScript implementation
- **Well-tested**: Comprehensive test coverage
- **Modern**: ESM-only, built for current tooling

## Supported Markdown

| Feature | Syntax | Support |
|---------|--------|---------|
| Paragraphs | Plain text | Universal |
| Bold | `**text**` | Universal |
| Italic | `*text*` or `_text_` | Universal |
| Inline code | `` `code` `` | Universal |
| Strikethrough | `~~text~~` | Universal |
| Links | `[text](url)` | Universal |
| Headings | `## text` | Context-dependent* |
| Bullet lists | `- item` | Universal |
| Ordered lists | `1. item` | Universal |
| Code blocks | ` ```lang ` | Universal |
| Block quotes | `> text` | Universal |

*See Heading Support section below.

## Critical: Heading Support

Headings are not universally supported in Jira's ADF implementation:

| Context | Headings | Preset |
|---------|----------|--------|
| Issue Comments | Not supported | `comment` |
| Task Issues | Not supported | `task` |
| Story/Epic Issues | Supported | `story` |

When headings aren't supported, they convert to bold paragraphs automatically.

## API Reference

### markdownToAdf(markdown, options?)

```typescript
function markdownToAdf(
  markdown: string,
  options?: ConversionOptions
): ADFDocument
```

#### ConversionOptions

```typescript
interface ConversionOptions {
  // Preset for specific Jira context
  preset?: 'comment' | 'task' | 'story' | 'default';

  // Use actual heading nodes (only for supported contexts)
  useHeadings?: boolean;

  // Maximum heading level (1-6)
  maxHeadingLevel?: 1 | 2 | 3 | 4 | 5 | 6;

  // Default language for unlabeled code blocks
  defaultCodeLanguage?: string;

  // Throw on unsupported markdown
  strictMode?: boolean;

  // Preserve single line breaks
  preserveLineBreaks?: boolean;
}
```

### Type Exports

All ADF types are exported:

```typescript
import type {
  ADFDocument,
  ADFParagraph,
  ADFHeading,
  ADFBulletList,
  ConversionOptions,
} from 'markdown-to-adf';
```

### Builder Functions

For manual ADF construction:

```typescript
import { doc, paragraph, text, strong } from 'markdown-to-adf';

const adf = doc([
  paragraph([
    text('Hello '),
    text('world', [strong()]),
  ]),
]);
```

## Examples

### Jira Comment

```typescript
const markdown = `
Key findings:

**Issues:**
- Authentication fails on retry
- Response timeout after 30s

Check the server logs for details.
`;

const adf = markdownToAdf(markdown, { preset: 'comment' });
```

### Task Description

```typescript
const markdown = `
## Acceptance Criteria
- Feature implements retry logic
- Tests cover edge cases
- Documentation updated

## Technical Notes
Requires API version 2.0 or higher.
`;

const adf = markdownToAdf(markdown, { preset: 'task' });
```

### Story Description

```typescript
const markdown = `
# User Story
As a developer, I need retry logic for API calls.

## Implementation
Add exponential backoff:

\`\`\`typescript
async function retryRequest(fn: () => Promise<T>, maxRetries = 3) {
  // implementation
}
\`\`\`

## Acceptance Criteria
- Retries up to 3 times
- Uses exponential backoff
`;

const adf = markdownToAdf(markdown, { preset: 'story' });
```

## Known Limitations

### Heading Support
Headings only work in Story/Epic issue types. Use appropriate presets or set `useHeadings: false`.

### Nested Lists
Nested lists are flattened. Multi-level list support is planned.

### Tables
Markdown tables are not supported due to ADF table complexity.

### Images
Image syntax (`![alt](url)`) is not yet implemented.

### HTML
Raw HTML in markdown is not supported.

## Troubleshooting

### "INVALID_INPUT" from Jira

Common causes:
1. Using headings in unsupported contexts (use `comment` or `task` preset)
2. Complex nesting that exceeds ADF schema limits
3. Unsupported markdown features

Solution: Start with simple markdown and gradually add complexity.

### Type Errors

Ensure TypeScript 5.3+ is installed:

```bash
npm install -D typescript@^5.3.0
```

## Development

```bash
bun install      # Install dependencies
bun test         # Run tests
bun test --watch # Watch mode
bun run typecheck  # Type checking
bun run build    # Build for distribution
```

## Why This Library Exists

Atlassian's ADF implementation has context-specific limitations that aren't well documented:

- Task issues don't support heading nodes
- Comments have a restricted schema
- No clear documentation of these constraints

This library encodes production learnings so you don't encounter these issues.

## License

MIT
