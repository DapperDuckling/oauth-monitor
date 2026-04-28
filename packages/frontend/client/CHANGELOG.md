# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-28

### Fixed

- `OauthMonitorClient.destroy()` now removes the `message` window listener (was leaking; only `storage` and `focus` were removed previously)

### Changed

- Bumped `typia` runtime validator from 5.5.10 to 12.0.2. No public API change.

### Added

- Comprehensive vitest test suite covering singleton lifecycle, auth check flow, expiration timer, login/logout navigation, storage events, and message handling

## [1.0.10] - 2025-11-25

### Added

- Initial release
