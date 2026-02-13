# Warnings

The warnings API surfaces lossy conversions or risky nodes so you can log, audit, or enforce policies.

## Types

- `lossy_conversion`: a supported input was downgraded (e.g., headings to bold).
- `unsupported_feature`: the input could not be represented (e.g., horizontal rules).
- `invalid_syntax`: the input contained invalid Markdown.
- `risky_feature`: valid ADF that is known to behave inconsistently in some contexts.

## Usage

```ts
import { markdownToAdfWithWarnings } from 'markdown-to-adf';

const { adf, warnings } = markdownToAdfWithWarnings(markdown, {
  preset: 'comment',
});
```
