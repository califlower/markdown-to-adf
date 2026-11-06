# Presets

Presets tune the converter for different Jira contexts.

## `comment`

- Converts headings to bold paragraphs.
- Converts block quotes to paragraphs (with warning).
- Converts task lists to bullet lists with `☐`/`☑` prefixes, since comments reject `taskList`.
- Enables `warnOnRiskyNodes` by default.

## `task`

- Converts headings to bold paragraphs.
- Conservative defaults.

## `story`

- Allows headings.
- Full feature support.

## `default`

- Safe defaults intended to work in most contexts.
