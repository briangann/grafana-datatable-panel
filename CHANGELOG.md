# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Scaffolding & Configuration

- Update `@grafana/create-plugin` from 5.27.1 to 7.1.7, applying all scaffolding migrations:
  docker-compose extension, is-compatible workflow action, `@typescript-eslint/no-deprecated`
  replacing `eslint-plugin-deprecation`, ESLint flat config, React/ReactDOM `^18.3.0`,
  webpack nested-plugin variable fix, `setupTests.d.ts` for `@testing-library/jest-dom` types
- Remove `.eslintrc` files in favor of `eslint.config.mjs` flat config
- Drop `@types/testing-library__jest-dom` (types now come from `.config/types/setupTests.d.ts`)
- Bump Node to 24 (`.nvmrc`, `mise.toml`, `package.json` engines)
- Update `AGENTS.md` Node requirement to `>= 24`

### Plugin metadata

- Bump `plugin.json` `grafanaDependency` to `>=11.6.0 <13.0.0` (upper-bound excludes Grafana 13
  until `@grafana/ui@13.x` stable is published and we can upgrade the `@grafana/*` deps)

### GitHub Workflows

- Align all five GitHub workflows with create-plugin 7.1.7 templates (actions/checkout@v6,
  setup-node@v6, setup-go@v6, upload-artifact@v7, download-artifact@v8, versioned
  `grafana/plugin-actions/*` tags, SHA-pinned `pnpm/action-setup` and `actions/setup-node`
  in `is-compatible.yml`, `persist-credentials` hardening)
- Bump `node-version` to 24 in `ci.yml`, `is-compatible.yml`, and `release.yml`
  (matches `.nvmrc` / `package.json` engines)
- Drop `master` from `on.push` / `on.pull_request` branches in `ci.yml`; repo uses `main` only
- Set `fail-if-incompatible: "no"` on the `is-compatible` workflow so type-only diffs
  (e.g. `PanelPlugin.setMigrationHandler` parameter rename `PanelMigrationHandler` →
  `type PanelMigrationHandler` between `@grafana/data@12.4.3` and `@13.0.1`) surface as
  a PR comment for review instead of failing CI. Mirrors the previous `.levignore.js`
  ignore for the same symbol.
- Cap E2E Grafana matrix to 4 versions via `grafana/plugin-actions/e2e-version`
  (`version-resolver-type: plugin-grafana-dependency`, `limit: 4`,
  `skip-grafana-dev-image: false`, `skip-grafana-react-19-preview-image: false`)
- E2E matrix: set `skip-grafana-dev-image: true` (exclude the Grafana 13 nightly that is
  not yet stable) and drop the explicit `skip-grafana-react-19-preview-image` input
  (default skip applies for non-grafana-org repos).
- Remove Code Climate coverage upload steps from `ci.yml` and Maintainability /
  Test Coverage badges from README (service sunset; test-reporter download URL now
  returns HTML 404)

### Dependencies

- Pin `@grafana/runtime` to 12.4.2 via pnpm override
  (upstream 12.4.3 declares `@grafana/ui@12.4.3`, which was never published)
- Bump 31 dependencies to latest within current major: `@babel/core`, `@emotion/css`,
  `@grafana/tsconfig`, `@playwright/test`, `@swc/core`, `@swc/helpers`, `@swc/jest`,
  `@testing-library/jest-dom`, `@types/lodash`, `@types/pdfmake`,
  `datatables.net{,-dt,-plugins}`, `datatables.net-buttons{,-dt}`,
  `datatables.net-fixedcolumns-dt`, `datatables.net-fixedheader-dt`,
  `datatables.net-keytable-dt`, `datatables.net-searchpanes-dt`,
  `datatables.net-select{,-dt}`, `moment-timezone`, `pdfmake`, `sass`, `semver`,
  `swc-loader`, `terser-webpack-plugin`, `tslib`, `webpack`
- Bump `@grafana/plugin-e2e` to `^3.5.1` (only breaking change vs 2.x was Node 18 drop; we are already on Node 24)
- Bump `@types/node` to `^24.12.2` to match the Node 24 runtime (tracks Node major)
- Add `@grafana/e2e-selectors@^12.4.3` as a devDependency for Playwright test selectors
- Remove unused devDependencies: `jest-junit` (leftover from Code Climate integration),
  `@types/react-router-dom` (router not installed), `@types/glob` (`glob` ships its own
  types since v10)
- Delete `.levignore.js` (levitate was replaced by the `is-compatible` GitHub action in the 7.1.7 template migration)
- Remove unused `jquery` dependency (webpack already externalizes `jquery`, so Grafana's
  global provides the runtime; `@types/jquery` stays for the `jQuery` ambient global used
  in `DataTablePanel.tsx`)

### React state hygiene

- Bump `eslint-plugin-react-hooks` to `^7.0.0` and `@grafana/eslint-config` to `^9.0.0`.
  v7 enables `react-hooks/immutability` and `react-hooks/set-state-in-effect`, which are
  now clean after the `useTracker` refactor. `@grafana/eslint-config@9` consumes the v7
  plugin's flat-config export.
- Add `src/hooks/useTracker.ts`: a typed, immutable `useTracker<Item, Payload>` hook
  encapsulating the ordered-tracker-with-onChange-fan-out pattern used by
  `ThresholdsEditor` and `ColumnStylesEditor`. Exposes `items`, `setAll`, `add`,
  `removeAt`, `updateAt`, `moveUp`, `moveDown`. Mutators use functional `setState` so
  they stay stable across renders and compose safely when two are called in the same
  event; `onChange` fires once per commit, outside `setState`, so StrictMode does not
  double-emit. Optional `adapter.reorder` re-numbers order-style fields after
  add/remove/move. Covered by `src/hooks/useTracker.test.ts`.
- Refactor `src/components/options/thresholds/ThresholdsEditor.tsx` onto `useTracker`.
  All state transitions now produce new tracker items and a new array; the previous
  in-place mutations are gone. Drops the unused `order` field from `ThresholdItemTracker`
  (written by the adapter, read nowhere), so `thresholdAdapter` keeps only `toPayload`.
  Covered by `ThresholdsEditor.test.tsx`.
- Refactor `src/components/options/columnstyles/ColumnStylesEditor.tsx` onto `useTracker`.
  Removed the in-place mutations and the local `arrayMove` helper; `moveUp`/`moveDown`
  delegate to the hook's immutable swap. Replaces the `columnHints` `useState` +
  `useEffect` pair with a `useMemo` derivation (fixes `react-hooks/set-state-in-effect`).
  Types the component as `StandardEditorProps<ColumnStyleItemType[]>` so `onChange` no
  longer needs a cast. The per-op `indexByOrder` wrappers were removed —
  `columnStyleAdapter` keeps `t.order === array index` invariantly, so callers pass hook
  mutators directly. Covered by `ColumnStylesEditor.test.tsx`.

### Fixes

- Remove `transparent={false}` from `Switch` usages in `ColumnStyleItem.tsx`
  (prop moved to `InlineSwitch` only; all sites relied on the default)
- Fix `tests/phase2-installed/check-installed.spec.ts` strict-mode locator collision on
  Grafana 11.6+ by anchoring the regex to "Installed Version" (the page now also renders
  "Latest Version")

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
- Template variables inside links can now reference other cell content of same row
  number (Issue #87)

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

- Autoscroll horizontally if number of columns is wider than the rendered panel
  (Issue #6)

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
