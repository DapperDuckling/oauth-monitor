# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.1] - 2026-11-04

### Fixed

- `OauthMonitorClient.authCheck()` now clears `localStorage` (`LocalStorage.USER_STATUS`), resets `userStatusHash`, and cancels any pending `expirationWatchSignal` timer on non-2xx responses (`401`/`403`/`500`) or `200 OK` `text/html` login redirects, preventing the standing heartbeat leader from polling indefinitely after session expiry
- `handleUpdatedUserStatus()`, `setupExpirationListener()`, and `destroy()` now cancel pending eager-refresh timers and reset `userStatusHash` when user status is removed or transitions to `loggedIn: false`
- `authCheck()` no longer schedules a duplicate background `authCheckNextTick(true)` timer via `authCheckNoWait()` when already executing a network check
- `authCheck()` now passes `credentials: "include"` at the top level of the `fetch` `RequestInit` options

### Added

- Unit tests covering session expiry during standing heartbeat polling, HTML login redirect handling, eager-refresh timer cancellation on `401`/logout/destroy, and cross-tab storage removal synchronization

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
