# AGENTS.md - Datatable Panel Plugin

Grafana panel plugin (`briangann-datatable-panel`) that renders query results with
[DataTables.net](http://www.datatables.net). Targets Grafana 10.3+, tested against
10.x/11.x/12.x. Frontend-only plugin (no backend / no `Magefile.go`).

Package manager is `pnpm` (see `packageManager` field in `package.json`). Node >= 24 (`.nvmrc` pins the version).

## Commands

Build, lint, test:

- `pnpm run dev` — webpack watch build (outputs `dist/`).
- `pnpm run build` — production webpack build.
- `pnpm run typecheck` — `tsc --noEmit`.
- `pnpm run lint` / `pnpm run lint:fix` — ESLint (+ Prettier on `:fix`).
- `pnpm run test` — Jest watch mode (only changed files).
- `pnpm run test:ci` — full Jest run used in CI (`--passWithNoTests --maxWorkers 4`, coverage on).
- Run a single Jest test file: `pnpm exec jest src/data/columns/columnStyles.test.ts`.
- Run a single test by name: `pnpm exec jest -t "partial test name"`.
- `pnpm run spellcheck` — cspell.

E2E (requires a running Grafana with the plugin mounted):

- `pnpm run server` — `docker compose up --build`. Launches Grafana on `:3000` with
  `dist/` bind-mounted at `/var/lib/grafana/plugins/briangann-datatable-panel`.
  Override Grafana version with `GRAFANA_VERSION=…` / image with `GRAFANA_IMAGE=…`.
  `dist/` must be built first (`pnpm run build` or `dev`).
- `pnpm run playwright:test` — run Playwright specs under `tests/` against
  `GRAFANA_URL` (default `http://localhost:3000`). The `auth` project logs in and
  caches cookies to `playwright/.auth/admin.json` before the `chromium` project
  runs.
- `pnpm run playwright:test:ui` / `pnpm run playwright:showreport` — Playwright UI / HTML report.

## Architecture

### `src/` layout

```text
src/
├── components/                  React components + Grafana panel options UI
│   ├── DataTablePanel.tsx       the panel
│   ├── styles.ts                Emotion styling
│   └── options/                 editor UI (Grafana options panel)
│       ├── columnstyles/        per-column style editor (ColumnStyleItem + ColumnStylesEditor)
│       └── thresholds/          per-style threshold editor (ThresholdItem + ThresholdsEditor)
├── data/                        panel options → DataTables config pipeline
│   ├── dataHelpers.ts           orchestrator (DataFrame → DataTables rows)
│   ├── transformations.ts       Grafana DataFrame transformers
│   ├── cells/                   cell-level rendering (formatter, createdCell, colors)
│   ├── columns/                 column-level config (alias, style matcher, width hints)
│   ├── layout/                  DataTables `layout` config (search bar position)
│   └── mappings/                Grafana value/range/regex mapping resolution
├── hooks/                       generic React hooks (useApplyTransformation, useTracker)
├── utils/                       cross-cutting helpers (color math)
├── images/, img/, screenshots/  static assets
├── migrations.ts                Angular → React options migration + defaults backfill
├── module.ts                    plugin entry (PanelPlugin registration)
├── plugin.json                  Grafana plugin manifest
└── types.ts                     single source of truth for all domain + runtime types
```

### Panel entry point & option pipeline

- `src/module.ts` registers the `PanelPlugin`, wires
  `DatatablePanelMigrationHandler` (for Angular → React option migration), disables
  most `FieldConfigProperty.*` standard options, and attaches `optionsBuilder` for
  the editor UI.
- `src/types.ts` is the source of truth for `DatatableOptions` and all option enums
  (transformation, paging, sorting, aggregations). Changes here almost always
  require corresponding updates to `src/migrations.ts` and
  `src/components/options/defaults.ts`.
- `src/components/options/optionsBuilder.tsx` wires editor controls (column
  aliases, width hints, sorting, column styles, thresholds) into the Grafana
  panel options panel. Style/threshold editors live in
  `src/components/options/columnstyles/` and `src/components/options/thresholds/`.

### Runtime data flow (panel render)

`src/components/DataTablePanel.tsx` is the single React component that renders the table. The pipeline for each render:

1. `GetDataTransformerID(props.options.transformation)`
   (`src/data/transformations.ts`) maps the plugin's `TransformationOptions` enum
   to a Grafana `DataTransformerID` (`joinByField`, `merge`, `reduce`,
   `seriesToRows`). `reduce` carries the user's aggregation list.
2. `useApplyTransformation` (`src/hooks/useApplyTransformation.ts`) runs the
   transformer over `props.data.series` via `transformDataFrame` +
   `lastValueFrom`, producing the `DataFrame[]` the table consumes.
3. `BuildColumnDefs` + `ConvertDataFrameToDataTableFormat`
   (`src/data/dataHelpers.ts`) turn the DataFrames into DataTables.net `columns`
   / `rows`.
4. `ApplyColumnAliases` (`data/columns/columnAliasing.ts`) and
   `ApplyColumnWidthHints` (`data/columns/columnWidthHints.ts`) mutate the
   column defs based on user options.
5. `data/cells/cellRenderer.ts` + `data/cells/createdCellHelpers.ts` produce
   per-cell `render` / `createdCell` callbacks that apply column styles,
   value/range mappings (`data/mappings/valueMappings.ts`,
   `data/mappings/mappingProcessor.ts`), thresholds
   (`data/mappings/overrides.ts` + `data/cells/cellColors.ts` +
   `src/utils/color.ts`), and URL macro expansion (`$__cell`, `$__cell_N`,
   `$__pattern_N`, `$__keepTime`, `$__from`, `$__to`).
6. The DataTables.net instance is constructed imperatively against a `ref` table
   element with a fixed `Config` assembled from panel options (paging, scrolling,
   search, row numbers, column filters, fixed headers, buttons, etc.). All
   DataTables extensions used (buttons, fixedcolumns, fixedheader, keytable,
   scroller, searchpanes, select, `mark.js`, pageResize, scrollResize) are
   imported at the top of this file for side effects — don't remove them blindly.

### Column styles

Four style kinds (see the `ColumnStyles` enum in `src/types.ts` and the
matcher in `src/data/columns/columnStyles.ts`): `Date`, `String`, `Hidden`,
`Metric`. First matching style per column wins — ordering matters. Metric
style is where thresholds + unit/decimal formatting apply.

### Migrations

`src/migrations.ts` handles panel options coming from older Angular versions of
this panel (plus Grafana value-mapping shape changes via
`convertOldAngularValueMappings`). When adding/renaming a field in
`DatatableOptions`, update the migration handler and its snapshot tests
(`src/migrations.test.ts`, `src/__snapshots__/`).

### Tests

- Jest config at repo root extends `./.config/jest.config`. `jest.config.js`
  forces `TZ=UTC` (needed for date-formatting snapshots) and collects coverage
  from all of `src/`.
- Snapshot tests live alongside source (e.g. `src/migrations.test.ts` +
  `src/__snapshots__/migrations.test.ts.snap`, `src/module.test.ts`).
- Playwright tests split into `tests/phase1-core`, `tests/phase2-installed`,
  `tests/phase3-panel`. The `auth` project in `playwright.config.ts` must run
  first to populate `playwright/.auth/admin.json`.

### Build config

Webpack config is under `.config/webpack/` (scaffolded by
`@grafana/create-plugin` — marked "do not edit directly"; extend per Grafana
plugin-tools docs). Same applies to `.config/tsconfig.json` and
`.config/jest.config.js`. Extensions live in the root `tsconfig.json`,
`jest.config.js`, etc.

TypeScript `baseUrl` is `src/`, so imports like `components/DataTablePanel`,
`hooks/useApplyTransformation`, `data/dataHelpers`, `types` are absolute (no
`./` prefix).

## CI/CD

### Checking CI Status

```bash
gh pr checks <PR-number>
```

### Workflows

| Workflow             | File                  | Trigger                       |
| -------------------- | --------------------- | ----------------------------- |
| CI                   | `ci.yml`              | Push to `main`, PRs to `main` |
| Release              | `release.yml`         | `workflow_dispatch`           |
| Compatibility Check  | `is-compatible.yml`   | `workflow_dispatch`           |
| Bundle Stats         | `bundle-stats.yml`    | PRs                           |
| Create Plugin Update | `cp-update.yml`       | `workflow_dispatch`           |

### CI Pipeline

The CI workflow (`ci.yml`) is an inline workflow (not a reusable workflow call) with three jobs:

1. **build** — pnpm install, typecheck, lint, unit tests, production build, plugin
   signing, packaging, and validation. Conditionally builds/tests Go backend if
   `Magefile.go` exists (this plugin has no backend).
2. **resolve-versions** — uses `grafana/plugin-actions/e2e-version` to resolve the
   Grafana image matrix (skips `grafana-dev`, includes React 19 preview).
3. **playwright-tests** — runs Playwright e2e tests against each resolved Grafana
   version in a Docker Compose environment. Uploads test reports as artifacts.

### Action Pinning

Pin all GitHub Actions to **commit SHAs** with a `# vX.Y.Z` comment identifying
the version (e.g., `actions/checkout@abc123...  # v6.0.3`). SHAs are immutable —
a tag can be force-pushed to a different commit, a SHA cannot. The comment keeps
the pinned version human-readable. Update the SHA when bumping the version.

## Grafana Compatibility Check

Before releasing, verify the built plugin is compatible with a target Grafana
version using `levitate`. Requires a production build first.

```bash
pnpm build
npx @grafana/levitate@latest is-compatible \
  --target @grafana/data@<version>,@grafana/ui@<version>,@grafana/runtime@<version> \
  --path dist/module.js
```

To check against the latest Grafana version, first look up the current `@grafana/data` version on npm:

```bash
npm view @grafana/data version
```

Then substitute that version into the `--target` flag above.

## Updating Plugin Scaffolding

To update the `.config` directory (Webpack, tsconfig, Jest config, etc.) to the latest Grafana plugin scaffolding:

```bash
npx @grafana/create-plugin@latest update
```

## Docker Development

`docker-compose.yaml` extends `.config/docker-compose-base.yaml` and bind-mounts
`dist/` at `/var/lib/grafana/plugins/briangann-datatable-panel`, plus
`provisioning/` (dashboards, datasources, alerting, notifiers). Grafana listens
on `:3000`. Override the Grafana version/image with `GRAFANA_VERSION=…` /
`GRAFANA_IMAGE=…`. Run `pnpm run server` to start it. Build `dist/` first.

## Code Style Guidelines

### Formatting (Prettier)

- Print width: **120**
- Single quotes, no JSX single quotes
- Trailing commas: `es5`
- Semicolons: always
- 2-space indentation, no tabs

### Naming Conventions

| Element             | Convention                        | Example                                 |
| ------------------- | --------------------------------- | --------------------------------------- |
| Component files     | `PascalCase.tsx`                  | `DataTablePanel.tsx`                    |
| Test files          | `<source>.test.tsx` or `.test.ts` | `columnStyles.test.ts`                  |
| Utility files       | `camelCase.ts`                    | `columnAliasing.ts`                     |
| Custom hooks        | `use<Name>.ts`                    | `useApplyTransformation.ts`             |
| Constants           | `SCREAMING_SNAKE_CASE`            | `DEFAULT_DATATABLE_OPTIONS`             |
| Interfaces          | PascalCase                        | `DatatableOptions`                      |
| Functions/variables | camelCase                         | `buildColumnDefs`, `getDisplayValue`    |

### TypeScript

- Use **interfaces** for component props and options objects.
- Prefer explicit generics: `useState<number>(0)`.
- Imports use the `src/` `baseUrl` (no `./` prefix for in-tree modules).

### React Components

- **Functional components only** with arrow functions.
- Styles via `@emotion/css` + Grafana's `useStyles2(getStyles)` pattern when needed.

### Testing Patterns (Jest + Testing Library)

- `TZ=UTC` is forced by `jest.config.js` — required for date-formatting snapshots. Don't rely on local time.
- Use `describe`/`it` blocks.
- Clean up in `beforeEach`/`afterAll` with `jest.clearAllMocks()` / `jest.resetAllMocks()`.
- Compare theme-resolved colors relatively (not by name) since `useTheme2` resolves names to hex values.
- Use `Array<T>` syntax for non-simple array types (ESLint rule).
- When changing `DatatableOptions` shape, regenerate migration snapshots in
  `src/__snapshots__/` intentionally — review the diff.

## Critical Rules

- **NEVER add a `Co-Authored-By` line to commit messages.** Applies to all
  agents, subagents, and automated commits. When dispatching subagents that
  will commit, explicitly instruct them: "Do NOT add a Co-Authored-By line."
- **Never modify anything inside `.config/`** — managed by Grafana plugin tooling.
- **Never change `id` or `type`** in `src/plugin.json`.
- Changes to `plugin.json` require a **Grafana server restart**.
- Use webpack from `.config/` for builds; do not add a custom bundler.
- Grafana API docs: <https://grafana.com/developers/plugin-tools/llms.txt>
- **Always run cspell** after making changes: `pnpm spellcheck`. Fix issues
  before committing. Add legitimate new words to `cspell.config.json`.
- **Always run `pnpm typecheck`** when `src/` files change and fix any type errors before committing.
- **NEVER comment on GitHub issues or PRs** unless the user explicitly asks.
  Draft the response and show it to the user first. Only post when told to do so.
- **NEVER commit unless the user explicitly asks.** Do not commit as part of completing a task.
- **NEVER push unless the user explicitly asks.** Never chain
  `git commit && git push` in one command. Always wait for the user to
  explicitly ask to push.
- **After pushing, always update the PR summary** if a PR exists for the current
  branch. Use `gh pr edit` to update the title and body with well-formatted text
  that reflects all changes across the entire branch.
- **Prefer subagents** for research, code exploration, and multi-step work.
  Launch multiple agents in parallel when tasks are independent.

## Changelog Policy

**Always update `CHANGELOG.md` when making changes.** Every commit that modifies
code, documentation, dependencies, or configuration must have a corresponding
entry in the changelog under the current unreleased version section. Add entries
as part of the same commit or as a follow-up commit before pushing.

## Markdown Policy

When `.markdownlint.yaml` and `markdownlint-cli2` are present, run the linter on markdown files before committing:

```bash
npx markdownlint-cli2 AGENTS.md README.md CHANGELOG.md
```

Target line length: 120. Fix issues before committing.

## Release Workflows (adoptable from gauge-panel)

These workflows are not yet present in this repo but can be copied from `briangann-gauge-panel`:

- **Version Bump & Changelog** (`.github/workflows/version-bump-changelog.yml`) —
  manual `workflow_dispatch`; inputs: `version` (`patch` / `minor` / `major`),
  `generate-changelog` (`true` / `false`).
- **Release Please** (`.github/workflows/release-please.yml`) — manual
  `workflow_dispatch`; automates version bumps + changelog, no inputs required.

## Branching Policy

- **Never commit directly to `main`**. Always create a new branch for changes.
- Use descriptive branch names (e.g., `feat/add-feature`, `fix/bug-description`).
- When checking out a branch or `main`, always `git fetch` and `git pull` to ensure you have the latest changes.
- **Always create pull requests as drafts** (`gh pr create --draft`).
- **Never add "Generated with Claude Code" or any AI-attribution line** to PR
  summaries, commit messages, or other output. Organize PR summaries with
  categorized change information (e.g., Dependencies, New Features, Cleanup).
  See also the `Co-Authored-By` rule in Critical Rules.
