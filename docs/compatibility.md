# Compatibility Guide

This library targets Jira Cloud ADF behavior and applies conservative conversions for different contexts.

## Presets

| Preset    | Intended context             |
| --------- | ---------------------------- |
| `comment` | Issue comments               |
| `task`    | Task-type issue descriptions |
| `story`   | Story/Epic descriptions      |
| `default` | Safe default across contexts |

## Node Compatibility

| Markdown feature | ADF output    | `comment`         | `task`            | `story` | Notes                                       |
| ---------------- | ------------- | ----------------- | ----------------- | ------- | ------------------------------------------- |
| Headings         | `heading`     | Converted to bold | Converted to bold | Allowed | Strict mode throws for incompatible presets |
| Paragraphs       | `paragraph`   | ✅                | ✅                | ✅      |                                             |
| Bullet lists     | `bulletList`  | ✅                | ✅                | ✅      |                                             |
| Ordered lists    | `orderedList` | ✅                | ✅                | ✅      |                                             |
| Task lists       | `taskList`    | ✅                | ✅                | ✅      | Inline-only in ADF                          |
| Code blocks      | `codeBlock`   | ✅                | ✅                | ✅      |                                             |
| Block quotes     | `blockQuote`  | ✅                | ✅                | ✅      |                                             |
| Tables           | `table`       | ✅ (risky)        | ✅                | ✅      | `comment` warns by default                  |
| Horizontal rules | —             | ❌                | ❌                | ❌      | Strict mode throws                          |

## Risky Nodes

Some nodes are valid but known to be inconsistent in certain Jira views. Use `warnOnRiskyNodes` or the `comment` preset to surface warnings.
