# Releasing

## Prerequisites

- An `NPM_TOKEN` secret configured in the GitHub repo.

## Release Steps (standard-version)

1. Ensure your working tree is clean.
2. Run one of:
   - `npm run release` (automatic version based on commits)
   - `npm run release:patch`
   - `npm run release:minor`
   - `npm run release:major`
3. Push commits and tags:
   - `git push origin main --follow-tags`
4. GitHub Actions will run the release workflow and publish to npm.
