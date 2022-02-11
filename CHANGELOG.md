# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Simple profiler options for saga time usage

## [2.1.0] - 2021-07-27
### Added
- Parallel processing of `combineSagas`

## [2.0.2] - 2021-01-29
### Fixed
- Add missing TS declarations

## [2.0.1] - 2020-06-30
### Fixed
- Not failing when other middleware removes action from processing

## [2.0.0] - 2020-06-23
### Added
- Allow saga updater functions to be async iterator generator

### Fixed
- Optimized production build of bundled JS
