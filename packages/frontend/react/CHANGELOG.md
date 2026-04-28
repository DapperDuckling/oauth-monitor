# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-28

### Changed

- Bumped `@dapperduckling/oauth-monitor-client` peer from 1.x to 2.x
- Bumped `@mui/material` and `@mui/icons-material` from 5.x to 7.x. Used internally by the bundled `Login`/`Logout`/`FloatingPill`/`Overlay` components; consumers using their own MUI install elsewhere are unaffected. (MUI v8 was skipped by upstream; v9 was held because it tightened polymorphic component types in a way that requires source changes.)
- Bumped `immer` from 10 to 11
- Bumped `use-immer` from 0.9 to 0.11 to match the declared peer

### Added

- Comprehensive vitest test suite covering reducer state transitions, the `useOauthMonitor` hook, `OauthMonitorProvider` lifecycle (mount/unmount/event handling/lengthy-login timeout), and all UI components

## [1.1.1] - 2025-12-06

### Fixed

- Prevent logout modal popping up unintentionally when using function based call to logout

## [1.1.0] - 2025-11-26

### Changed

- Allow devs to completely override components

## [1.0.12] - 2025-11-26

### Fixed

- Issue where when invalid tokens were detected the user status loggedIn property was not set to false

## [1.0.11] - 2025-11-25

### Added

- Initial release
