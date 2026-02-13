# markdown-to-adf

[![CI](https://github.com/califlower/markdown-to-adf/actions/workflows/ci.yml/badge.svg)](https://github.com/califlower/markdown-to-adf/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/markdown-to-adf.svg)](https://www.npmjs.com/package/markdown-to-adf)
[![license](https://img.shields.io/npm/l/markdown-to-adf.svg)](https://github.com/califlower/markdown-to-adf/blob/main/LICENSE)

Convert Markdown to Atlassian Document Format (ADF) with context-aware presets for Jira.

Built from production experience: this library handles the nuances of ADF support across different Jira contexts, preventing the "INVALID_INPUT" errors that plague manual ADF generation.

## Installation

### From npm

```bash
npm install markdown-to-adf
```

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

You can also reference it directly in your `package.json`:

```json
{
  "dependencies": {
    "markdown-to-adf": "git+https://github.com/califlower/markdown-to-adf.git#v0.2.0"
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
const adf = markdownToAdf(markdown, { preset: 'task' }); // For Task issues
const adf = markdownToAdf(markdown, { preset: 'story' }); // For Story/Epic issues
```

## Features

- **Type-safe**: Full TypeScript support with comprehensive types
- **Context-aware**: Presets optimized for different Jira contexts
- **AST-backed parsing**: Uses markdown-it for spec-accurate Markdown parsing
- **Well-tested**: Comprehensive test coverage
- **Modern**: ESM-only, built for current tooling

## Docs

- Presets: `docs/presets.md`
- Compatibility: `docs/compatibility.md`
- Warnings: `docs/warnings.md`

## Supported Markdown

| Feature       | Syntax               | Support             |
| ------------- | -------------------- | ------------------- | --- | --- | --------------------------------- |
| Paragraphs    | Plain text           | Universal           |
| Bold          | `**text**`           | Universal           |
| Italic        | `*text*` or `_text_` | Universal           |
| Inline code   | `` `code` ``         | Universal           |
| Strikethrough | `~~text~~`           | Universal           |
| Links         | `[text](url)`        | Universal           |
| Headings      | `## text`            | Context-dependent\* |
| Bullet lists  | `- item`             | Universal           |
| Ordered lists | `1. item`            | Universal           |
| Task lists    | `- [ ] item`         | Universal           |
| Tables        | `                    | a                   | b   | `   | Universal (risky in comments)\*\* |
| Code blocks   | ` ```lang `          | Universal           |
| Block quotes  | `> text`             | Universal           |

\*See Heading Support section below.  
\*\*Tables are valid in comments but can be inconsistent in some Jira views.

## Critical: Heading Support

Headings are not universally supported in Jira's ADF implementation:

| Context           | Headings      | Preset    |
| ----------------- | ------------- | --------- |
| Issue Comments    | Not supported | `comment` |
| Task Issues       | Not supported | `task`    |
| Story/Epic Issues | Supported     | `story`   |

When headings aren't supported, they convert to bold paragraphs automatically.
With `strictMode: true`, incompatible headings throw instead of converting.

Tables are valid in comments, but can be flaky in some Jira surfaces. The `comment` preset enables
`warnOnRiskyNodes` by default to surface these cases.

## API Reference

### markdownToAdf(markdown, options?)

```typescript
function markdownToAdf(markdown: string, options?: ConversionOptions): ADFDocument;
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

  // Warn on risky-but-valid nodes (e.g., tables in comments)
  warnOnRiskyNodes?: boolean;

  // Preserve single line breaks
  preserveLineBreaks?: boolean;
}
```

### markdownToAdfWithWarnings(markdown, options?)

```typescript
function markdownToAdfWithWarnings(
  markdown: string,
  options?: ConversionOptions,
): { adf: ADFDocument; warnings: ConversionWarning[] };
```

### Warnings

Use the warnings API when you want visibility into lossy conversions or risky nodes:

```typescript
import { markdownToAdfWithWarnings } from 'markdown-to-adf';

const { adf, warnings } = markdownToAdfWithWarnings(markdown, {
  preset: 'comment',
});
```

Warnings can include:

- `lossy_conversion` (e.g., headings converted to bold)
- `unsupported_feature` (e.g., horizontal rules)
- `risky_feature` (e.g., tables in comments)

The `comment` preset enables `warnOnRiskyNodes` by default.

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

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Breaking changes will be released in a major version.

### Builder Functions

For manual ADF construction:

```typescript
import { doc, paragraph, text, strong } from 'markdown-to-adf';

const adf = doc([paragraph([text('Hello '), text('world', [strong()])])]);
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

### List Item Content

List items can only contain paragraphs and nested lists. Other blocks inside list items are dropped with warnings.

### Tables

Tables are supported, but can be inconsistent in some Jira comment views. Use the warnings API to audit usage.

### Images

Image syntax (`![alt](url)`) is converted to linked text; ADF media nodes are not emitted.

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
bun run lint     # Lint
bun run format   # Format
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
