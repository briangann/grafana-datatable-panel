# Change Log

All notable changes to this project will be documented in this file. This project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Configurable search bar position** (closes #191) — Move the global search input to any corner of the table: Top
  Left, Top Right, Bottom Left, or Bottom Right. Default remains Top Right.
- **Configurable text alignment for string columns** (closes #282) — A new panel-level **Right Align Text** toggle and a
  per-column **Cell Alignment** selector (Left / Center / Right) give full control over text alignment for all column
  types.
- **Clickthrough URLs now resolve Grafana dashboard variables** — Variables like `$host`, `${var}`, and `[[var]]` are
  substituted in clickthrough URLs, matching the behavior of built-in data links. Plugin macros (`$__cell`, `$__from`,
  etc.) are applied first.
- **Minimum Grafana version is now 12.3.0** — Required for Grafana 13 / React 19 compatibility.
- **Plugin loads significantly faster** — Bundle size reduced from 1.13 MB to 445 KB (60% smaller).

### Bug Fixes

- **Clickthrough macros only replaced the first occurrence** (closes #324) — `$__cell_N`, `$__cell`, `$__from`, `$__to`,
  `$__keepTime`, and `$__pattern_N` now replace every occurrence in a URL template, not just the first. A URL like
  `?from=$__from&label=$__from` now expands both references correctly.
- **Column filters misaligned columns and typing didn't filter** (closes #278) — Enabling "Filter by Column" no longer
  shifts column content, and typing in a filter input now actually filters rows. Filtering matches the displayed
  (formatted) value, not the raw number.
- **Setting 0 decimal places was ignored** — A column style configured with 0 decimal places now correctly shows
  integers instead of falling back to the field default.
- **Panel crashed with split-by-pattern on null cell values** — Fixed a crash when a cell contained a null value and a
  split-by-pattern clickthrough was configured.
- **Time columns showed wrong time in non-UTC timezones** — Timestamps are now correctly converted from UTC to the
  target timezone. Previously, UTC digits were displayed with the target zone's offset applied to the label only,
  producing incorrect times.
- **Clickthrough URLs lost the port number and rejected relative paths** (closes #276) — URLs like
  `http://host:8080/path` now preserve the port. Relative paths like `/d/uid/slug?var=x` and non-HTTP schemes are also
  handled correctly.
- **First paint briefly showed unformatted data** — The table is now hidden until DataTables has fully initialized,
  preventing a flash of raw, unstyled content.
- **Threshold color was silently lost after editing thresholds** — Editing a threshold no longer drops the color mode
  setting, restoring threshold cell coloring after any threshold change.
- **Column open/close state shifted after reordering or removing column styles** — Expanded column style editors now
  stay expanded for the correct column after a reorder or delete operation.

## [2.0.2] - 2025-05-29

### Fixed

- Fixes playwright tests

## [2.0.1] - 2025-05-29

### Fixed

- Fixes loss of styles when sorting by column interactively
- Fixes crashing bug on bad data input

### Removed

- Removed empty `src/README.md`

## [2.0.0] - 2025-05-20

Ported to React, not published.

## [1.0.4] - 2023-09-11

### Changed

- Updates for compatibility with v10.x
- Packages updated

### Fixed

- Signature Fixed
- Minor bug fix

> NOTE: this plugin will be migrated to React soon!

## [1.0.3] - 2020-12-05

### Added

- Added mark plugin to highlight matching text in search results (from PR #98)
- Align Number to right option (default is on)

### Changed

- Plugin is now signed

### Fixed

- Crash when regex formatter is empty (Issue #124)

## [1.0.2] - 2020-06-26

### Added

- Column filtering option
- Template variables inside links can now reference other cell content of same row number (Issue #87)

### Fixed

- Sorting is working correctly now (Issue #104)
- Row/Column coloring working again (Issue #100)
- Formatting working (general appearance problems) (Issue #105)
- Now loads with older versions of Grafana (Issue #97)

## [1.0.1] - 2020-05-02

### Changed

- Pulled in `file_export` from older version of Grafana for compatibility
- Added `file-saver` dependency required by `file_export`
- v7 no longer supplies `isUTC` setting from dashboard; test and default to false

## [1.0.0] - 2020-04-21

### Added

- Option to use orthogonal data option to sort by value and not formatted value
  - <https://datatables.net/manual/data/orthogonal-data>
- Time macros `$__from`, `$__to`, `$__keepFrom` will be replaced in clickable urls

### Changed

- Updated to use new `@grafana/toolkit` build process
- Packages updated

### Fixed

- Column index sorting was wrong when row numbers set true
- Light theme search area now more visible

### Removed

- `moment` package

## [0.0.9] - 2019-09-07

### Fixed

- `stringToJsRegex` reference error

## [0.0.8] - 2019-09-07

### Changed

- Updated packages

## [0.0.7] - 2019-07-26

### Added

- CircleCI added to publishing

### Changed

- Conversion to typescript
- Updated all packages

> New features/bugfixes by contributor jmp0x00, thanks!!

## [0.0.6]

### Fixed

- Compatibility for v5

## [0.0.5]

### Fixed

- SystemJS path changes for Grafana > 4.6

## [0.0.4]

### Added

- Autoscroll horizontally if number of columns is wider than the rendered panel (Issue #6)

## [0.0.3]

### Added

- Export options for Clipboard/CSV/PDF/Excel/Print

### Fixed

- Saving State should now work — wrong option was in the datatable constructor
- Columns from datasources other than JSON can now be aliased
- No data now clears table (Issue #5)

## [0.0.2]

### Added

- Option for a cell or row to link to another page
- Clickable links inside table
- Multi-column sorting — sort by any number of columns ascending/descending
- Column Aliasing — modify the name of a column as sent by the datasource
- Column width hints — suggest a width for a named column

### Fixed

- Missing CSS files
- CSS files now load when Grafana has a subpath

## [0.0.1]

- First release
