# Releasing

## Prerequisites

- An `NPM_TOKEN` secret configured in the GitHub repo.

## Release Steps

1. Update `CHANGELOG.md` under the next version.
2. Bump the version in `package.json`.
3. Tag the release: `git tag vX.Y.Z` and push the tag.
4. GitHub Actions will run the release workflow and publish to npm.
