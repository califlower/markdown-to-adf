# Releasing

## Prerequisites

- npm Trusted Publishing enabled for this repo (`.github/workflows/release.yml`).
- GitHub Actions OIDC enabled (default) and Release workflow permissions set.

## Release Steps (standard-version)

1. Ensure your working tree is clean.
2. Run one of:
   - `npm run release` (automatic version based on commits)
   - `npm run release:patch`
   - `npm run release:minor`
   - `npm run release:major`
3. Push commits and tags:
   - `git push origin main --follow-tags`
4. GitHub Actions will run the release workflow, create the GitHub release, and publish to npm.
