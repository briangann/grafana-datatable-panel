# Change Log

All notable changes to this project will be documented in this file.

## [Unreleased]

- Bump Node to 24 (`.nvmrc`, `mise.toml`, `package.json` engines)
- Update `AGENTS.md` Node requirement to `>= 24`
- Update `@grafana/create-plugin` from 5.27.1 to 7.1.7, applying all scaffolding migrations: docker-compose extension, is-compatible workflow action, `@typescript-eslint/no-deprecated` replacing `eslint-plugin-deprecation`, ESLint flat config, React/ReactDOM `^18.3.0`, webpack nested-plugin variable fix, `setupTests.d.ts` for `@testing-library/jest-dom` types
- Pin `@grafana/runtime` to 12.4.2 via pnpm override (upstream 12.4.3 declares `@grafana/ui@12.4.3`, which was never published)
- Drop `@types/testing-library__jest-dom` (types now come from `.config/types/setupTests.d.ts`)
- Remove `.eslintrc` files in favor of `eslint.config.mjs` flat config
- Align all five GitHub workflows with create-plugin 7.1.7 templates (actions/checkout@v6, setup-node@v6, setup-go@v6, upload-artifact@v7, download-artifact@v8, versioned `grafana/plugin-actions/*` tags, SHA-pinned `pnpm/action-setup` and `actions/setup-node` in `is-compatible.yml`, `persist-credentials` hardening)
- Remove `transparent={false}` from `Switch` usages in `ColumnStyleItem.tsx` (prop moved to `InlineSwitch` only; all sites relied on the default)
- Remove Code Climate coverage upload steps from `ci.yml` and Maintainability / Test Coverage badges from README (service sunset; test-reporter download URL now returns HTML 404)
- Bump `node-version` to 24 in `ci.yml`, `is-compatible.yml`, and `release.yml` (matches `.nvmrc` / `package.json` engines)
- Drop `master` from `on.push` / `on.pull_request` branches in `ci.yml`; repo uses `main` only
- Bump `plugin.json` `grafanaDependency` to `>=11.6.0`
- Cap E2E Grafana matrix to 4 versions via `grafana/plugin-actions/e2e-version` (`version-resolver-type: plugin-grafana-dependency`, `limit: 4`, `skip-grafana-dev-image: false`, `skip-grafana-react-19-preview-image: false`)
- Fix `tests/phase2-installed/check-installed.spec.ts` strict-mode locator collision on Grafana 11.6+ by anchoring the regex to "Installed Version" (the page now also renders "Latest Version")

## [2.0.2] - 2025-05-29

- Fixes playwright tests

## [2.0.1] - 2025-05-29

- Fixes loss of styles when sorting by column interactively
- Fixes crashing bug on bad data input
- Removed empty src/README.md

## [2.0.0] - 2025-05-20

Ported to React, not published

## [1.0.4] - 2023-09-11

- Updates for compatibility with v10.x
- Packages updated
- Signature Fixed
- Minor bug fix
- NOTE: this plugin will be migrated to React soon!

## [1.0.3] - 2020-12-05

- NEW: Added mark plugin to highlight matching text in search results (from PR #98)
- NEW: Align Number to right option (default is on)
- FIX: Crash when regex formatter is empty: Issue #124
- Plugin is now signed

## [1.0.2] - 2020-06-26

- NEW: column filtering option
- Sorting is working correctly now Issues: #104
- Row/Column coloring working again Issue: #100
- Formatting working (general appearance problems) Issue: #105
- Now loads with older versions of Grafana Issue: #97
- Template variables inside links can now reference other cell content of same row number (Issue: #87)

## [1.0.1] - 2020-05-02

- pulled in file_export from older version of grafana for compatibility
- add dependency file-saver require my file_export
- v7 no longer suppolies isUTC setting from dashboard, test and default to false

## [1.0.0] - 2020-04-21

- Added option to use orthogonal data option to sort by value and not formatted value
  - <https://datatables.net/manual/data/orthogonal-data>
- Remove moment package
- Updated to use new @grafana/toolkit build process
- Packages updated
- FIX: column index sorting was wrong when row numbers set true
- FIX: light theme search area now more visible
- NEW: time macros $__from, $__to, $__keepFrom will be replaced in clickable urls

## [0.0.9] - 2019-09-07

- Fix stringToJsRegex reference error

## [0.0.8] - 2019-09-07

- update packages

## [0.0.7] - 2019-07-26

New features/bugfixes by contributor jmp0x00, thanks!!
Conversion to typescript
Updated all packages
CircleCI added to publishing

## (previous) Changelog

|Version|Changes|
|-------|-----------|
|0.0.1  | first release |
|0.0.2  | NEW: Added option for a cell or row to link to another page|
|       | NEW: Supports Clickable links inside table |
|       | BUGFIX: Fixed missing CSS files |
|       | BUGFIX: CSS files now load when Grafana has a subpath|
|       | NEW: Added multi-column sorting - sort by any number of columns ascending/descending|
|       | NEW: Column Aliasing - modify the name of a column as sent by the datasource|
|       | NEW: Column width hints - suggest a width for a named column|
|0.0.3  | BUGFIX: Saving State should now work - wrong option was in the datatable constructor|
|       | NEW: Export options for Clipboard/CSV/PDF/Excel/Print|
|       | BUGFIX: Columns from datasources other than JSON can now be aliased|
|       | BUGFIX: No data now clears table (issue #5)|
|0.0.4  | NEW: Now autoscrolls horizontally if number of columns is wider|
|       | than the rendered panel (issue #6)|
|0.0.5  | BUGFIX: SystemJS path changes for Grafana > 4.6|
|0.0.6  | BUGFIX: Compatibility for v5|
|1.0.0  | Update packages and convert to toolkit|
