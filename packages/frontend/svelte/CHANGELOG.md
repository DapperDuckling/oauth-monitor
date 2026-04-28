# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-28

### Changed

- Bumped `@dapperduckling/oauth-monitor-client` peer from 1.x to 2.x

### Added

- `omcClient` optional field on `OauthMonitorState` so the active client is reachable from the store. The existing `getContext('oauth-monitor-client')` pattern continues to work and remains the recommended access path inside components.
- Comprehensive vitest test suite covering store reducer transitions, `OauthMonitor` lifecycle, and all UI components

### Fixed

- `SET_OMC_CLIENT` action now stores the client reference on the state (was silently a no-op, divergent from the React reducer; `OauthMonitor.svelte` had been dispatching it on mount with no effect). Internal `cloneState` helper preserves the client by reference around `structuredClone`, which cannot copy class instances.

## [1.1.1] - 2025-12-06

### Fixed

- Prevent logout modal popping up unintentionally when using function based call to logout

## [1.1.0] - 2025-11-26

### Changed

- Allow devs to completely override components

## [1.0.12] - 2025-11-26

### Fixed

- Export of store type
- Modernized svelte dynamic variable reference

## [1.0.11] - 2025-11-26

### Fixed

- Issue where when invalid tokens were detected the user status loggedIn property was not set to false

## [1.0.10] - 2025-11-25

### Added

- Initial release
