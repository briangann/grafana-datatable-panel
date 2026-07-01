# Roadmap

Features planned or under consideration for `briangann-datatable-panel`. Ordered by priority within each tier.
Items in **In Progress / Unreleased** are already merged to `main` and will ship in the next release.

---

## In Progress / Unreleased

See [CHANGELOG.md](./CHANGELOG.md#unreleased) for full details on what is already merged.

---

## Tier 1 — Near-term (next minor release)

### Progress Bar Column Style

Render a numeric column as a progress bar instead of (or alongside) a formatted number. Two implementation
options exist; both are available at zero new dependency cost.

**Motivation:** Provides at-a-glance proportional context for metrics like completion percentage, queue depth, or
utilisation — without needing a separate Gauge or Bar Gauge panel per column.

---

#### Option A — Native HTML5 `<progress>` element

**Design: `renderAs` sub-option on `ColumnStyleMetric`**

Add `renderAs: 'value' | 'progress' | 'both'` rather than a new top-level style kind. Progress bars only make
sense for numeric data, and all existing threshold coloring continues to apply on top.

| Sub-option | Behaviour |
|---|---|
| `value` (default) | Current behaviour — formatted number string. |
| `progress` | Replace cell content with `<progress value="…" max="…"></progress>`. |
| `both` | `<progress>` bar + formatted value string side-by-side inside the cell. |

Additional fields on `ColumnStyleMetric`:

| Field | Type | Default | Notes |
|---|---|---|---|
| `progressMin` | `number` | `0` | Lower bound. |
| `progressMax` | `number` | `100` | Upper bound. Defer `'auto'` (column-scan pass) to a follow-up. |

Threshold integration: when `colorMode` is set and a threshold resolves, apply the color via
`style="accent-color: <color>"` — the standard CSS property for tinting native progress elements, no extra
library required.

**Pros:** Theme-aware colors via Grafana thresholds, arbitrary min/max range, fills cell width, zero new imports.
**Cons:** Browser-native appearance only; no border, shape, or background customization.

---

#### Option B — `percentBar` DataTables plug-in (already in `datatables.net-plugins`)

`datatables.net-plugins` is already installed and already used (for `pageResize` / `scrollResize` features).
`node_modules/datatables.net-plugins/dataRender/percentageBars.mjs` is available with a single import.

The plugin renders a nested `<div>` bar and accepts seven visual parameters plus an eighth `conditionalColors`
parameter: `[{ min, max, barColor, backgroundColor, textColor }]`. This maps directly to the existing
`Threshold[]` structure — the bridge is converting `Threshold[]` → `conditionalColors[]` at render time.

| Aspect | Option A (native `<progress>`) | Option B (`percentBar`) |
|---|---|---|
| Range | Configurable min/max | 0–100% only (hard-capped) |
| Cell width | Fills available width | Hard-coded `max-width: 100px` |
| Colors | Theme-aware via `accent-color` | Explicit hex strings |
| Shape | None | `square` or `round` |
| Border | None | Configurable style + color |
| Sorting | Needs explicit orthogonal value return | Built-in (`type !== 'display'` handled) |
| Import | None | One `import` line |
| Suitable for | Arbitrary numeric ranges | Percentage-only columns |

Implementation would add `percentBarShape`, `percentBarTextColor`, `percentBarBorderColor`, `percentBarBarColor`,
`percentBarBackColor`, `percentBarBorderStyle` fields to `ColumnStyleMetric` (all optional, with defaults matching
the plugin's own defaults). The existing `Threshold[]` array is converted to `conditionalColors` at render time,
so threshold configuration reuses the existing UI.

**Pros:** Richer visuals (shape, border), built-in orthogonal data support, threshold bridge is natural.
**Cons:** Percentage-only (0–100), fixed `max-width: 100px` restricts cell layout, raw hex colors bypass Grafana
theming.

---

**Recommendation:** Ship Option A first — it supports non-percentage ranges and integrates cleanly with the
existing threshold/color pipeline. Add Option B as an opt-in alternative for users who need richer bar styling on
percentage columns. The two options can coexist under `renderAs`: `'progress'` (native) vs `'percentBar'`.

**Open questions to settle before coding:**

1. Does `renderAs: 'progress'` suppress the formatted text entirely, or echo the value as a `title` tooltip?
2. Is `progressMin` needed in v1, or is `0` always sufficient?
3. Ship Option B alongside Option A, or defer until Option A is in production?

---

## Tier 1 — Near-term (continued)

### Migrate to `datatables.net-react`

Replace the current imperative jQuery/DataTables initialisation in `DataTablePanel.tsx` with the official
`datatables.net-react` wrapper component (`v1.0.2`, compatible with the plugin's current `datatables.net@2.3.8`).

**Motivation:** The current implementation manually destroys and rebuilds the DataTables instance inside a
`useEffect` on every option change (lines 262–407 of `DataTablePanel.tsx`). This produces:
- A fragile destroy/reinit cycle with a jQuery `.off('.columnFilter')` + `.destroy()` + `.empty()` sequence
- `initComplete` callback complexity for hidden columns, column filters, and the `dataTableReady` visibility gate
- Spread jQuery interop (`$()`, `jQuery.fn.dataTable.isDataTable()`) in a React component
- HTML string injection for cell rendering (`render()`) + jQuery DOM mutation for threshold coloring (`createdCell()`)

The React wrapper eliminates most of this:

| Area | Current | With `datatables.net-react` |
|---|---|---|
| Destroy/reinit | Manual `aDT.destroy()` + `jQuery(...).DataTable(config)` | Reactive `data` + `columns` props; wrapper diffs and updates |
| CSS classes | `dataTableClassesEnabled` state + string join | `className` prop computed inline |
| jQuery interop | `$()`, `jQuery.fn.dataTable.isDataTable()`, `.off('.columnFilter')` | Eliminated — `ref.current.dt()` API only |
| Cell rendering | HTML strings from `render()` + jQuery DOM mutation in `createdCell()` | `slots` per column → proper JSX |
| API access | `this.api()` inside `initComplete` | `ref.current.dt()` after mount |
| Events | Manual callback props inside config object | `on*` props (`onDraw`, `onInit`, etc.) |

**Dependencies:**

- Add: `datatables.net-react` (no new transitive deps; peer dep is `datatables.net ^2.1.3` — already satisfied)
- Keep: all existing `-dt` extension packages unchanged
- Remove: direct jQuery usage from `DataTablePanel.tsx`

**`slots` and the progress bar feature:** Once on the React wrapper, the progress bar (Tier 1 above) becomes a
first-class React component (`<progress>` element or a styled div) rendered via a slot function — no HTML string
injection required. Doing the React migration first makes the progress bar implementation cleaner.

**Known constraint — row-level coloring:** The `slots` API is cell-scoped. The current `colorMode: Row` and
`colorMode: RowColumn` paths in `createdCellHelpers.ts` apply colour to sibling `<td>` elements via jQuery. The
React wrapper's `options.createdRow` callback (still supported) is the replacement — it fires once per row and
receives the `<tr>` DOM node, so the same coloring logic can move there without the jQuery dependency. This needs
to be verified before the render pipeline is rewritten.

**Files touched:**

- `package.json` — add `datatables.net-react`
- `src/components/DataTablePanel.tsx` — replace `useEffect` init chain with `<DataTable>` component; four effects
  collapse to one data-processing effect + reactive JSX props
- `src/data/cells/cellRenderer.ts` + `createdCellHelpers.ts` — convert `render`/`createdCell` per-column functions
  to `slots` functions returning JSX; row coloring moves to `createdRow` in `options`
- `src/data/dataHelpers.ts` — `BuildColumnDefs` may simplify if `columnDefs` overlap with `slots`

**Open questions to settle before coding:**

1. The `initComplete` pattern (hidden columns, column filters, `dataTableReady`) maps to `onInit` event prop — verify
   `onInit` fires at the same point as `initComplete` and receives the same API object.
2. `slots` vs `columns.render`: confirm that `slots` functions support the three-parameter form
   `(data, type, row) => JSX` so orthogonal data (sort-by-value vs display) still works correctly.
3. Column filter init (`enableColumnFilters`) uses jQuery to append `<input>` to column header cells post-init.
   Validate that this can move to `onInit` with `ref.current.dt()` and zero jQuery.
4. Is `datatables.net-react` the correct base, or does the plugin's CSS-theming (`styles.ts`) require a specific
   styled variant (e.g. `-bs5`)? Current styling is all custom Emotion CSS applied to the container — `datatables.net-dt`
   (default, no framework styling) is almost certainly correct.

**Sequencing recommendation:** Do the React migration before the progress bar feature, so the progress bar is
implemented cleanly as a slot-based React component from day one rather than as an HTML string in the old pipeline
and then refactored again.

---

## Tier 1 — Near-term (continued)

### Activate FixedHeader (already imported, never wired)

`datatables.net-fixedheader-dt` is already imported in `DataTablePanel.tsx` for side-effect registration — the
extension is loaded on every panel render. The `fixedHeader` option is never passed to the DataTables config, so
the feature is completely inert. Exposing it is low effort.

**What it does:** Pins the `<thead>` to the top of the browser viewport as the user scrolls the Grafana dashboard
page down past the panel. Without it, the column headers scroll off screen when the panel is taller than the
viewport.

**Constraint — incompatible with scroll mode:** FixedHeader targets *window-level* scrolling. When `scroll: true`
the plugin uses DataTables' `scrollY` internal scroll container, which already keeps the header visible within
that container. Enabling FixedHeader on top of `scrollY` causes a duplicate/conflicting header. The option must
be **disabled and hidden** in the editor when `props.options.scroll === true`.

**Grafana nav offset:** Grafana's top navigation bar is fixed to the viewport at roughly 56 px. Without a
`headerOffset`, the pinned header slides under the nav bar. Expose `fixedHeaderOffset: number` (default `0`,
documented as "set to ~56 if using a fixed Grafana nav bar") rather than hard-coding the value, since the exact
height varies by Grafana version and whether the nav is shown.

**Footer support:** `fixedHeader: { footer: true }` pins the `<tfoot>` to the bottom of the viewport. The plugin
does not currently render a `<tfoot>`, so footer support can be deferred. Note the option in the editor if/when
a summary row feature is added.

**New panel options:**

| Option | Type | Default | Notes |
|---|---|---|---|
| `fixedHeaderEnabled` | `boolean` | `false` | Activates the extension. Hidden when `scroll: true`. |
| `fixedHeaderOffset` | `number` | `0` | `headerOffset` value in pixels; compensates for Grafana's top nav. |

**Files touched:**

- `src/types.ts` — add `fixedHeaderEnabled`, `fixedHeaderOffset` to `DatatableOptions`
- `src/migrations.ts` — backfill both fields with defaults
- `src/components/DataTablePanel.tsx` — pass `fixedHeader: { headerOffset: fixedHeaderOffset }` (or `false`) in
  `dtOptions`; add both to the `useEffect` dep array
- `src/components/options/` — two controls in the Visual panel section; hide both when `scroll` is on

---

### Activate FixedColumns (already imported, never wired)

`datatables.net-fixedcolumns-dt` is in the same state as FixedHeader — imported, never configured. The plugin
already sets `scrollX: true` in the DataTables config, which is the prerequisite for FixedColumns to function.

**What it does:** Freezes N columns at the left and/or right edge of a horizontally scrolling table. Useful when
a table has many columns and the user wants to keep an identifier column (hostname, service name, timestamp)
pinned while scrolling right.

**No mode conflict:** Unlike FixedHeader, FixedColumns works alongside both paging and scroll modes since it
operates on the horizontal axis. `scrollX: true` is unconditionally set today, so no special-casing needed.

**Implementation: `position: sticky`** — FixedColumns v4+ uses CSS `position: sticky` rather than DOM cloning.
Frozen columns are their original `<td>` elements, just CSS-pinned. This significantly reduces interaction risk
with the plugin's post-`initComplete` visibility logic: hiding a sticky `<td>` via `api.column(i).visible(false)`
removes it from the layout cleanly — there is no detached clone to leave a gap.

**Interaction with row numbers:** When `rowNumbersEnabled: true` the first column is the auto-generated row
number column. `fixedColumnsStart: 1` would freeze that column, which is probably undesirable. Document in the
editor hint: "When row numbers are enabled, column 1 is the row number column."

**Interaction with hidden columns:** Lower risk than originally assessed — `position: sticky` means no clone, so
hiding a frozen column simply collapses it. Still worth a smoke test to confirm DataTables doesn't leave `sticky`
CSS on a zero-width cell.

**New panel options:**

| Option | Type | Default | Notes |
|---|---|---|---|
| `fixedColumnsStart` | `number` | `0` | Columns to freeze at the left edge. `0` = disabled. |
| `fixedColumnsEnd` | `number` | `0` | Columns to freeze at the right edge. `0` = disabled. |

When both are `0`, `fixedColumns` is not passed to the DataTables config (extension stays dormant).

**Files touched:**

- `src/types.ts` — add `fixedColumnsStart`, `fixedColumnsEnd` to `DatatableOptions`
- `src/migrations.ts` — backfill both fields to `0`
- `src/components/DataTablePanel.tsx` — conditionally pass `fixedColumns: { start: N, end: M }` when either > 0;
  add to the `useEffect` dep array
- `src/components/options/` — two number inputs in the Visual or Columns section

---

## Tier 2 — Medium-term

### Conditional / Expression-Based Clickthrough URLs

Today `clickThrough` is a static template resolved via `$__cell`, `$__cell_N`, and Grafana variable macros. There
is no way to choose a different URL based on cell value at runtime.

**Proposed:** Add `clickThroughConditions: Array<{ pattern: string; url: string }>` to `ColumnStyleString`. Each
entry is tested in order; the first matching entry's URL wins; falls through to the existing `clickThrough` default
if none match. Pattern is a regex, reusing `stringToJsRegex` already in the codebase.

**Complexity:** Medium. Adds a dynamic list editor similar to the existing threshold editor. No new DataTables
dependency.

### Column Tooltip / Hover Detail

Show full cell content (or a configurable template) in a tooltip on hover. Useful when columns are width-capped and
content is truncated.

**Complexity:** Low–Medium. No native DataTables tooltip API; a `createdCell` callback sets `title` (zero dependency)
or `data-tippy-content` for richer tooltips (requires `tippy.js`). Ship `title` first.

### Sparkline / Inline Trend Column

Render a small inline sparkline for time-series data. The `reduce` transformation collapses series to a single
value — a sparkline mode would need to retain the original series alongside the reduced value, changing the data
pipeline significantly.

**Complexity:** High. Requires either a separate data pass to carry unreduced series into the cell renderer, or a
new transformation mode. Deferred until the progress bar render-mode pattern is validated in production.

---

## Tier 3 — Speculative / Needs Validation

- **Icon / badge column** — render a named Grafana icon (`@grafana/ui`) based on value or threshold state. Feasibility
  depends on how cleanly React-rendered SVG can be injected into a DataTables cell without breaking sorting/filtering
  orthogonal data.
- **Row expand / detail row** — click to expand an inline child row showing all fields. Useful when only a subset of
  columns are visible. Maps to DataTables' native child row API.
- **Heatmap column coloring** — gradient-color entire column min → max with no threshold required. Visualises
  distribution at a glance. Needs a pre-render column scan similar to `'auto'` progress max.

---

## Won't Do

- **Backend / server-side processing** — intentionally frontend-only; all data comes from Grafana's query pipeline.
- **Editable cells** — out of scope; use Grafana native forms or a dedicated editing plugin.
- **DataTables Editor integration** — commercial product; not appropriate for an open-source Grafana plugin.
