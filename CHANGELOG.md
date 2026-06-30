# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-30

### Added

- Rich series header that surfaces the show poster, rating, air status, and genres at a glance.
- Live "ping" indicator on the status badge for series that are currently running.
- Refreshed brand icon set (new logo with a teal-to-blue gradient and the `S✓` mark), plus a distinct icon for development builds.
- New promotional images and store assets.
- Automated release workflow that builds and publishes the packaged Chrome extension to a GitHub Release on every `v*` tag.

### Changed

- Redesigned the series header for readability: it now stays sticky while scrolling, uses higher-contrast status and genre text (especially in light theme), and has refined spacing and alignment.
- Removed the premiered/ended date block from the header to give the title more room.
- Refreshed the README with a new layout, updated screenshots, and current tech-stack badges.
- Upgraded GitHub Actions to versions that run on Node.js 24.

### Fixed

- Episode timestamp logic now tracks watched state accurately.

[1.1.0]: https://github.com/farengeyt451/seenit-extension/releases/tag/v1.1.0
