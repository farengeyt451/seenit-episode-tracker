# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 03/07/2026

### Added

- Footer in the popup with quick links to the project's GitHub repository and the author's LinkedIn.

### Fixed

- Favorites now sync reliably: toggling a favorite stamps a fresh timestamp on every change, so un-favoriting on one device is no longer reverted back to favorite when devices merge.
- Series order is preserved on a freshly installed device: a populated cloud ordering is no longer discarded in favor of the empty local order during the first sync.

## [1.1.0] - 30/06/2026

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

## [1.0.7] - 17/06/2026

### Added

- Drag-and-drop reordering of series in your list.
- Favorite styling and theme support for items in the series list.

### Changed

- Disabled the disconnect button while a sync is in progress.
- Refactored component imports for consistency across the codebase.

## [1.0.6] - 14/06/2026

### Added

- New merge strategy for favorited series so favorites reconcile correctly during sync.

### Changed

- Reduced sync debounce and phase delays for more responsive syncing.

### Fixed

- More robust favorites toggle logic, including a null check for episode timestamps.

## [1.0.5] - 03/06/2026

### Changed

- Identity permission is now requested dynamically, only when it is actually needed.

## [1.0.4] - 02/06/2026

### Changed

- Improved sync button state handling and overall sync logic.

### Fixed

- Corrected punctuation and wording in the extension description.

## [1.0.3] - 01/06/2026

### Added

- Google Drive cloud sync: connect your account to back up and sync your series across devices.
- Cloud sync status and connection UI in Settings, with automatic reconnect and an initial sync on startup.
- Tooltip component for clearer interactions.
- Zod configuration for CSP compliance and improved sync error logging.

### Changed

- Documentation updates clarifying cloud sync availability.

## [1.0.2] - 25/05/2026

### Added

- Initial public release: track your favorite series and episodes in a simple, cozy interface, with favorites, dark and light themes, and offline support. Series metadata is powered by TheTVDB.

[1.1.1]: https://github.com/farengeyt451/seenit-extension/releases/tag/v1.1.1
[1.1.0]: https://github.com/farengeyt451/seenit-extension/releases/tag/v1.1.0
[1.0.7]: https://github.com/farengeyt451/seenit-extension/releases/tag/v1.0.7
[1.0.6]: https://github.com/farengeyt451/seenit-extension/releases/tag/v1.0.6
[1.0.5]: https://github.com/farengeyt451/seenit-extension/releases/tag/v1.0.5
[1.0.4]: https://github.com/farengeyt451/seenit-extension/releases/tag/v1.0.4
[1.0.3]: https://github.com/farengeyt451/seenit-extension/releases/tag/v1.0.3
[1.0.2]: https://github.com/farengeyt451/seenit-extension/releases/tag/v1.0.2
