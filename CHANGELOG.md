# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Configurable text alignment for string columns** (closes #282). String
  columns were previously hard-coded to right-align in `getColumnClassName`
  with no user-visible knob. Two complementary controls:
  - Panel-level **Right Align Text** toggle (`alignStringsToRightEnabled`,
    default `true`). Disabling it lets string columns inherit the
    DataTables default (left-aligned).
  - Per-column **Cell Alignment** Select on each column style
    (`ColumnStyleItemType.align`, values `default | left | center |
    right`). A non-`default` value paints an inline `text-align` on each
    matching cell that overrides the panel-level class. Applies to any
    `activeStyle` (metric / string / date), so the same knob covers all
    column types.
- **Clickthrough URLs resolve Grafana dashboard variables**. A clickthrough
  like `http://example.com/h/$host?x=1` now substitutes the dashboard's
  `$host` variable into the rendered href, matching the behavior of
  built-in data links. Completes the long-standing `// TODO: allowing
  template variables would be a great addition` comment in
  `src/data/cellRenderer.ts`.
  - **Feature.** `ProcessClickthrough` runs `replaceVariables(clickThrough)`
    immediately after the plugin's `ReplaceCellMacros` pass and before
    sanitize / URL rebuild. Guarded by `/[$\[]/.test(clickThrough)` so
    URLs without template markers short-circuit the call on the
    per-cell hot path.
  - **Syntax & precedence.** `$var`, `${var}`, and `[[var]]` all resolve.
    Plugin macros (`$__cell`, `$__cell_N`, `$__pattern_N`, `$__from`,
    `$__to`, `$__keepTime`) run first, so a dashboard variable named
    identically to a plugin macro cannot intercept the plugin's
    substitution.
  - **Plumbing.** A new `replaceVariables: InterpolateFunction` parameter
    is threaded from `PanelProps` in `DataTablePanel.tsx` through
    `BuildColumnDefs`, `ProcessStringValueStyle`, and
    `ProcessClickthrough`.
  - **Tests.** Three new unit cases in `src/data/cellRenderer.test.ts`
    (substitution, guard, precedence); a new
    `src/data/createdCellHelpers.test.ts` pinning the mid-layer
    `ProcessStringValueStyle` forwarding; and an E2E assertion in
    `tests/phase3-panel/clickthrough-urls.spec.ts` against a provisioned
    dashboard carrying a constant `$host = web-42` template variable.
  - **Docs.** README `#### Supported URL Formats` subsection extended
    with the three template-variable syntaxes and the precedence rule.
  - **Ancillary (type hygiene).** The delegated jQuery handlers bound
    in `DataTablePanel.tsx` by PR #292 are now typed with
    `JQuery.TriggeredEvent` so TypeScript resolves to the current
    `$.fn.on(...)` overload instead of the deprecated
    `JQueryEventObject` one.

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
- Tighten `GITHUB_TOKEN` permissions to least privilege. Each workflow declares
  `permissions: {}` at the workflow level and grants only the minimum scopes per
  job: `ci.yml` `build` / `resolve-versions` / `playwright-tests` = `contents: read`,
  `publish-report` = `contents: write` + `pull-requests: write`; `bundle-stats.yml`
  `compare` = `contents: read` + `pull-requests: write` + `actions: read`;
  `cp-update.yml` `release` = `{}` (the action authenticates via `GH_PAT_TOKEN`).
- Add `.github/workflows/coverage.yml` — Jest Coverage job. Runs on PRs, runs
  `jest --coverage` on the PR and base branches via pnpm, posts a diff summary
  via `davelosert/vitest-coverage-report-action`.
- Add `.github/workflows/pr-files.yml` — File Changes Summary job. Posts a
  grouped, collapsible PR comment listing changed files by area (Source / Tests /
  CI-CD / Config / Docs / Other) using `tj-actions/changed-files` and
  `actions/github-script`. Upserts a single marker-scoped comment so repeated
  runs replace rather than append.
- `ci.yml` `publish-report` job: outer `actions/checkout` set to
  `persist-credentials: false` — the nested `gh-pages` checkout inside
  `deploy-report-pages` was stacking a second Authorization header and failing
  with `Duplicate header: Authorization` / HTTP 400.

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
- Bump `eslint-plugin-react-hooks` to `^7.0.0` and `@grafana/eslint-config` to `^9.0.0`.
  v7 enables `react-hooks/immutability` and `react-hooks/set-state-in-effect`, which are
  now clean after the `useTracker` refactor. `@grafana/eslint-config@9` consumes the v7
  plugin's flat-config export.

### Refactoring

- Remove a stale `// @ts-ignore` + `TODO: fix this ignore, it works but should not be
  required` in `src/data/transformations.ts:transformData`. The ignore was covering
  a type mismatch between `lastValueFrom` and the `Observable<DataFrame[]>` returned
  by `transformDataFrame`; current `@grafana/data` / `rxjs` versions align
  (both resolve to `rxjs@7.8.2`) so the call typechecks cleanly now.
- Wire `props.replaceVariables` into `ApplyGrafanaOverrides`
  (`src/data/overrides.ts`). The function previously passed a no-op
  `(value) => value` to `applyFieldOverrides`; now that the panel already
  threads `replaceVariables` for clickthrough URLs, the override pass
  picks up the real interpolator too, so Grafana dashboard variables
  referenced inside field-config defaults resolve identically to the
  stock link/threshold pipelines.
- Add the missing `break;` after `case MappingType.RegexToText:` in
  `src/data/valueMappings.ts:getValueMappingResult`. The previous code
  fell through into `case MappingType.SpecialValue:` when a regex did
  not match — latent (the inner switch's `match` discriminant is
  `undefined` on a RegexToText options object, so every `SpecialValue`
  sub-case was a no-op in practice) but fragile. Pinned with a new
  regression test that confirms the iteration continues cleanly to the
  next mapping after a non-matching regex.
- Add `src/hooks/useTracker.ts`: a typed, immutable `useTracker<Item, Payload>` hook
  encapsulating the ordered-tracker-with-onChange-fan-out pattern used by
  `ThresholdsEditor` and `ColumnStylesEditor`. Exposes `items`, `setAll`, `add`,
  `removeAt`, `updateAt`, `moveUp`, `moveDown`. Mutators use functional `setState` so
  they stay stable across renders and compose safely when two are called in the same
  event; `onChange` fires once per commit, outside `setState`, so StrictMode does not
  double-emit. `updateAt` accepts either a static `Partial<Item>` patch or a functional
  patch `(prev) => Partial<Item>` so callers can read the live item without closing
  over a render-captured snapshot. Optional `adapter.reorder` re-numbers order-style
  fields after add/remove/move. Covered by `src/hooks/useTracker.test.ts`.
- Refactor `src/components/options/thresholds/ThresholdsEditor.tsx` onto `useTracker`.
  All state transitions now produce new tracker items and a new array; the previous
  in-place mutations are gone. The color and state setters use the functional
  `updateAt` patch form so the spread baseline reads the freshest threshold rather
  than a render-captured one. Drops the unused `order` field from
  `ThresholdItemTracker` (written by the adapter, read nowhere), so `thresholdAdapter`
  keeps only `toPayload`. Covered by `ThresholdsEditor.test.tsx`, which also guards
  against `setter` firing on mount.
- Refactor `src/components/options/columnstyles/ColumnStylesEditor.tsx` onto
  `useTracker`. Removed the in-place mutations and the local `arrayMove` helper;
  `moveUp`/`moveDown` delegate to the hook's immutable swap. Replaces the
  `columnHints` `useState` + `useEffect` pair with a `useMemo` derivation (fixes
  `react-hooks/set-state-in-effect`). Types the component as
  `StandardEditorProps<ColumnStyleItemType[]>` so `onChange` no longer needs a cast.
  Keys the per-row `isOpen` state by tracker `ID` (previously a parallel
  `boolean[]` indexed by array position, which smeared open state onto neighbors
  after reorder or remove — latent bug pre-refactor, now fixed). Drops the unused
  outer `order` field from `ColumnStyleItemTracker`, the dead `const [settings] =
  useState(...)` snapshot, and the `indexByOrder` wrappers. `createDuplicate`
  simplified to spread-with-overrides. Covered by `ColumnStylesEditor.test.tsx`,
  which locks in the `isOpen`-by-`ID` behavior across remove and guards against
  `onChange` firing on mount.
- Move `ColumnAlignment` / `ColumnAlignmentOptions` into `src/types.ts`
  alongside the other global option enums (`ColumnStyleColoring`,
  `DatatablePagingType`, `AggregationType`).
- Collapse the two adjacent positional booleans on `getColumnClassName`,
  `BuildColumnDefs`, and `ConvertDataFrameToDataTableFormat` into a single
  `AlignmentFlags = { numbers, strings }` struct, so a transposition at a
  call site would now be a type error.
- Memoize the `AlignmentFlags` literal in `DataTablePanel.tsx` with
  `useMemo` keyed on the two panel booleans. The three `useEffect` dep
  arrays now depend on the memoized reference instead of the two raw
  primitives — same re-run cadence per toggle, but the stable-identity
  invariant is enforced by reference equality instead of by convention,
  so a future contributor can't accidentally cause an infinite loop by
  dropping an inline object into a dep array.

### Tooling

- Add `markdownlint-cli2@^0.22.0` as a devDependency and wire up `lint:md` /
  `lint:md:fix` scripts in `package.json`. Ignore globs cover `node_modules`,
  `dist`, `coverage`, `TODO.md` (not tracked, gitignored), and `.config/`
  (managed by `@grafana/create-plugin`).
- `.markdownlint.yaml`: set `MD024: siblings_only: true` so repeated
  `### Added` / `### Fixed` subsections across different release headings
  don't trip `no-duplicate-heading`. Standard Keep-a-Changelog configuration.

### Fixes

- **Column-filter row no longer misaligns columns, and typing now actually
  filters** (closes #278). Enabling "Filter by column" previously injected
  a filter row after DataTables had already cached column widths and
  stripped all layout classes from the cloned cells, pushing content
  outside its column. The injection now runs inside DataTables'
  `initComplete`, preserves `dt-*` layout classes (only sort-interactivity
  classes are stripped), adds `columns.adjust()` to resync the scrollX
  header clone, debounces the search handler at 250 ms, and guards against
  duplicate filter rows on re-init. A themed CSS block sizes each input to
  `width: 100%` with `box-sizing: border-box` so the input never exceeds
  its cell. Input handlers are bound via jQuery event delegation on the
  table container so they survive the per-draw header-clone refresh that
  DataTables does in scrollX mode — without this, the visible inputs
  (which live in the `.dt-scroll-head` clone) carried no listeners and
  typing was a no-op. Click propagation is stopped on the filter row so a
  filter click can't trigger a header sort. DataTables' `searching`
  feature is now enabled whenever `columnFiltersEnabled` is on (previously
  a user with `searchEnabled=false` had `searching=false`, which made
  `api.column(i).search()` a no-op — the visible fields accepted text but
  nothing filtered); `layout: { topEnd: null }` suppresses the stray
  global search control so no unwanted search box appears. Per-column
  filtering is also now WYSIWYG: the `render` callback returns
  `valueFormatted` for DataTables' `filter` orthogonal data instead of
  `valueRaw`, so typing the displayed string (e.g. `5.00`, not the raw
  `5`) matches. Two Playwright specs pin the fix:
  `tests/phase3-panel/column-filter-alignment.spec.ts` covers the
  alignment invariant and filter-row interactivity against the DataTables
  v2 `dt-scroll-head` / `dt-scroll-body` DOM, and
  `tests/phase3-panel/column-filter-many-columns.spec.ts` exercises a
  nine-column provisioned dashboard end-to-end — including real user
  keystrokes that fire the delegated handler. Additional hardening from
  code review: delegated `.columnFilter` handlers are now explicitly
  detached before `destroy()` so a container-reuse teardown path cannot
  accumulate stale listeners across re-inits; filter `<input>` elements
  are built via `document.createElement` rather than `$th.html(template)`
  so a column title containing a `"` cannot break out of the placeholder
  attribute (`textUtil.sanitize` strips tags but does not escape
  attribute-context quotes); and `setDataTableReady(true)` inside
  `initComplete` is now gated on a `mountedRef` so the async callback
  cannot setState on an unmounted component.
- **First-paint no longer flashes un-formatted data.** The panel previously
  rendered the `<table>` node as soon as the transformed rows were cached
  but before DataTables had initialized, so users saw a brief flash of the
  raw table (no formatters, no threshold coloring, no filter row) before it
  settled. A `dataTableReady` state now stays `false` until DataTables'
  `initComplete` fires; a themed loading overlay covers the wrapper and
  the `<table>` is rendered with `visibility: hidden` until then. The
  overlay also re-hides the table on every re-init triggered by an options
  change, so transient draws between `destroy` and the next `initComplete`
  don't leak through either.
- Remove `transparent={false}` from `Switch` usages in `ColumnStyleItem.tsx`
  (prop moved to `InlineSwitch` only; all sites relied on the default)
- Fix `tests/phase2-installed/check-installed.spec.ts` strict-mode locator collision on
  Grafana 11.6+ by anchoring the regex to "Installed Version" (the page now also renders
  "Latest Version")
- Fix threshold cell coloring being silently dropped in `ColumnStyleItem.setThresholds`.
  The old code hand-enumerated seven `metricStyle` fields when rebuilding the style for
  `setColumnStyle`, but omitted `colorMode`. Any threshold add/edit left `colorMode`
  `undefined`, which fails `getCellColors`'s `colorMode != null` guard and suppresses
  the background/foreground paint. Replaced with `{ ...style.metricStyle, thresholds: val }`
  so no field can be silently lost. Pinned by a new `ColumnStyleItem.test.tsx` that
  round-trips a fully-populated `metricStyle` through a threshold add and asserts
  every field — including `colorMode` — survives.
- Satisfy `pnpm lint:md` across `README.md`, `AGENTS.md`, `CLAUDE.md`, and
  `provisioning/README.md` (line wraps to the 120-char limit, table re-padding
  for aligned pipes, `# Provisioning` heading added to `provisioning/README.md`,
  inline `markdownlint-disable-file` comment in `CLAUDE.md` for the intentional
  `<include>AGENTS.md</include>` directive). `CHANGELOG.md` was reorganised in
  the same pass: Unreleased categorised into subsections and older releases
  split into Added / Changed / Fixed / Removed groups, with the legacy pre-
  0.0.7 table converted to per-version sections.
- Patch alignment defaults into existing React-saved panels.
  `DatatablePanelMigrationHandler`'s non-Angular branch returned
  `panel.options` unchanged, so the first load of a panel saved before
  #282 would read `alignStringsToRightEnabled=undefined` and render the
  options editor's Switch in an "off" state while the panel itself was
  still right-aligning via the class. A new `applyOptionDefaults` helper
  seeds `alignStringsToRightEnabled=true` when missing and stamps
  `align='default'` on every column style that lacks it. The helper is
  the documented hook for any future field added to `DatatableOptions`
  or `ColumnStyleItemType`.
- Defense-in-depth: `createdCell` now whitelists `aStyle.align` against
  `ColumnAlignmentOptions` before piping it into jQuery's
  `.css('text-align', ...)`. The value comes from panel JSON and is
  typed but not runtime-validated, so a hand-crafted dashboard could
  previously feed an arbitrary string into the DOM style API. Browsers
  reject invalid `text-align` values so there's no known exploit; this
  hardens the boundary anyway.
- **Clickthrough URLs preserve host:port and accept relative paths** (closes
  #276). The URL rebuild in `ProcessClickthrough` used `url.hostname`, which
  drops the port (`http://host:8080/x` → `http://host/x`), and called
  `new URL(clickThrough)` without a fallback base, which threw on relative
  paths like `/d/uid/slug` and caused the panel to fail to render. The
  rebuild now branches: HTTP/HTTPS URLs are parsed with `url.host` (port
  preserved), path-relative inputs (leading `/`, not `//`) are parsed with
  `window.location.origin` as the base so nothing throws, and non-HTTP
  schemes or protocol-relative inputs (`mailto:`, `ftp://`, `//host/path`)
  are emitted verbatim. `url.hash` (fragments like `#panel-2`) is now
  preserved, and the trailing `?` no longer appears when the query is
  empty. Supported URL forms are documented in the README. Regression
  pinned with six parameterized cases in `src/data/cellRenderer.test.ts`
  plus an end-to-end spec
  (`tests/phase3-panel/clickthrough-urls.spec.ts`) that loads a
  provisioned dashboard and asserts the rendered `<a href>` for
  host:port and relative clickthroughs across multiple rows.

### Testing

- Extend `ColumnStylesEditor.test.tsx` to pin the `isOpen`-by-`ID` invariant
  across `moveUp`, `moveDown`, `Add Style`, and `createDuplicate`. The existing
  suite only covered the `remove` case; the matching behavior on reorder and
  insert paths is now locked in.
- Add a `useTracker.test.ts` case for `updateAt` with an out-of-range index so
  the `target === undefined` early-return is exercised.
- Add `tests/phase3-panel/thresholds-color.spec.ts`. Loads the
  `Datatable-RandomWalk-CustomThresholds` provisioned dashboard via
  `readProvisionedDashboard`, then asserts A-series cells render with inline
  `color:` styling (`colorMode=value`) and the configured `unitFormat=areaM2`
  suffix. DOM-level protection for the `setThresholds` fix — a future
  regression that drops `colorMode` or the unit formatter would fail this
  spec rather than silently paint default-colored cells.
- Unit cases for the #282 alignment feature: `migrations.test.ts` pins
  both the Angular-path `migrateDefaults` seeds and the React-path
  `applyOptionDefaults` patching (missing flag, explicit `false`
  preserved, missing `align` stamped, end-to-end handler flow).
  `ColumnStyleItem.test.tsx` parameterizes the Cell Alignment Select
  emit test across LEFT / CENTER / RIGHT and pins the DEFAULT fallback
  when `style.align` is undefined. `ColumnStylesEditor.test.tsx`
  asserts `addItem` stamps `align='default'` on new trackers and that
  `createDuplicate` carries `align` through the spread-with-overrides
  copy (same bug class as the `colorMode` regression).
- Add `src/data/dataHelpers.test.ts` — parameterized branch table for
  `getColumnClassName` across every `columnType` × alignment-flag
  combination (number / string / time / date / boolean × on / off).
  Core of the #282 contract (strings can be un-right-aligned) is now a
  hard assertion, not an implementation detail.
- Add `tests/phase3-panel/text-alignment.spec.ts` plus
  `provisioning/dashboards/dashboards/Datatable-TextAlignment.json`.
  Loads a panel whose column style sets `align='left'` and asserts at
  least one cell carries an inline `text-align: left` — DOM-level
  protection for the per-column override path.
- Add `tests/phase3-panel/text-alignment-panel-level.spec.ts` plus
  `provisioning/dashboards/dashboards/Datatable-TextAlignmentPanelLevel.json`.
  Uses a csv_content target (`Name`, `Value`) with
  `alignStringsToRightEnabled=false` and
  `alignNumbersToRightEnabled=true` — asserts the Name column cells
  do NOT carry `dt-right` while the Value column cells still do. This
  is the end-to-end proof of issue #282 itself: the panel-level
  switch disables class-level right-alignment on string columns.

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
