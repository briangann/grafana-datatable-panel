import { CellMetaSettings } from 'datatables.net';
import { InterpolateFunction, TimeRange } from '@grafana/data';
import {
  ColumnStyles,
  DTData,
  FlatRow,
  FormattedColumnValue,
} from 'types';
import { getCellColors } from './cellColors';
import { computeCellAlignment, computeMetricCellColors } from './cellStyleComputer';
import { processStringValueStyle } from './createdCellHelpers';

export type CreatedCellContext = {
  dtData: DTData;
  rowNumbersEnabled: boolean;
  fontSizePercent: string;
  timeRange: TimeRange;
  replaceVariables: InterpolateFunction;
  // Pre-computed at BuildColumnDefs time: indices of columns that use
  // colorMode=Row. applyRowColor only scans these instead of all columns,
  // reducing per-cell cost from O(cols) to O(k) where k is usually 0 or 1.
  rowColorColumnIndices: number[];
  // Pre-computed indices of columns using colorMode=RowColumn. The row color
  // derived from these columns is painted onto every non-METRIC cell; METRIC
  // cells keep their own per-cell threshold color.
  rowColumnColorColumnIndices: number[];
  // Single-entry caches keyed by rowIndex. DataTables calls createdCell for
  // all cells in a row sequentially, so the O(k) scan runs once per row.
  _lastRowColor?: { rowIndex: number; bg: string | null; fg: string | null };
  _lastRowColumnColor?: { rowIndex: number; bg: string | null; fg: string | null };
};

/**
 * DataTables `render` callback for a column def.
 * Handles orthogonal data requests (sort/filter/display/type).
 */
export function renderCell(
  dtData: DTData,
  _data: unknown,
  type: string | undefined,
  val: FlatRow,
  meta: CellMetaSettings,
): FormattedColumnValue | string | number | null {
  if (type === undefined) {
    return null;
  }
  const aColumn = dtData.Columns[meta.col];
  if (aColumn === undefined) {
    return null;
  }
  const returnValue = val[meta.col];
  if (type === 'type') {
    return returnValue;
  }
  if (returnValue !== null && typeof returnValue === 'object' && 'valueFormatted' in returnValue) {
    if (type === 'sort') {
      return returnValue.valueRaw;
    }
    // filter and display both return the formatted value (WYSIWYG)
    return returnValue.valueFormatted;
  }
  // Plain number (e.g. rowNumber column) — no formatting.
  return returnValue;
}

/**
 * Paints the Row-mode threshold color onto `cell`.
 *
 * Only the columns listed in `rowColorColumnIndices` are scanned — those are
 * the METRIC/Row columns pre-identified by BuildColumnDefs. If the list is
 * empty the function returns immediately with no work done (O(1)), keeping
 * tables without row coloring at zero overhead per cell.
 *
 * When multiple Row-mode columns exist the one with the highest threshold
 * state wins. State is compared, not array index, so columns with different
 * threshold counts are handled correctly across heterogeneous configurations.
 */
function applyRowColor(cell: HTMLElement, flatRow: FlatRow | undefined, rowIndex: number, ctx: CreatedCellContext): void {
  // No Row-mode columns — nothing to do.
  if (ctx.rowColorColumnIndices.length === 0) { return; }
  if (!flatRow) { return; }

  // Cache hit: DataTables calls createdCell for every cell in a row
  // sequentially before moving to the next row, so the worst-color for this
  // rowIndex is already computed. Return immediately — O(1) for cells 2..N.
  if (ctx._lastRowColor?.rowIndex === rowIndex) {
    const { bg, fg } = ctx._lastRowColor;
    if (bg !== null) {
      cell.style.setProperty('color', fg ?? 'white', 'important');
      cell.style.setProperty('background-color', bg, 'important');
    }
    return;
  }

  let worstState = -1;
  let worstBg: string | null = null;
  let worstFg: string | null = null;

  // First cell in this row: scan the pre-identified Row-mode columns (O(k)).
  for (const k of ctx.rowColorColumnIndices) {
    const s = ctx.dtData.Columns[k]?.columnStyles?.[0];
    if (!s) { continue; }
    const cellEntry = flatRow[k];
    if (typeof cellEntry !== 'object' || cellEntry === null) { continue; }
    const colorData = getCellColors(s, cellEntry as FormattedColumnValue);
    if (colorData?.bgColorIndex !== null && colorData?.bgColorIndex !== undefined) {
      // Compare threshold state (user-assigned ordinal: 0=ok, 1=warning, 2=critical),
      // not array index, so columns with different threshold counts compare correctly.
      const state = s.metricStyle?.thresholds?.[colorData.bgColorIndex]?.state ?? colorData.bgColorIndex;
      if (state > worstState) {
        worstState = state;
        worstBg = colorData.bgColor;
        worstFg = colorData.color;
      }
    }
  }

  // Store for subsequent cells in this row.
  ctx._lastRowColor = { rowIndex, bg: worstBg, fg: worstFg };

  if (worstBg !== null) {
    cell.style.setProperty('color', worstFg ?? 'white', 'important');
    cell.style.setProperty('background-color', worstBg, 'important');
  }
}

/**
 * Paints the RowColumn-mode threshold color onto non-METRIC cells.
 *
 * Scans `rowColumnColorColumnIndices` for the worst threshold (O(k)) and
 * applies the result to every cell whose column style is NOT METRIC — those
 * cells keep their own per-cell threshold color. Uses the same per-row cache
 * pattern as applyRowColor: the scan runs once per row, O(1) for cells 2..N.
 */
function applyRowColumnColor(
  cell: HTMLElement,
  flatRow: FlatRow | undefined,
  rowIndex: number,
  colIndex: number,
  ctx: CreatedCellContext,
): void {
  if (ctx.rowColumnColorColumnIndices.length === 0) { return; }
  if (!flatRow) { return; }

  // METRIC cells keep their own per-cell threshold color — skip them.
  if (ctx.dtData.Columns[colIndex]?.columnStyles?.[0]?.activeStyle === ColumnStyles.METRIC) { return; }

  // Cache hit: same row, result already computed.
  if (ctx._lastRowColumnColor?.rowIndex === rowIndex) {
    const { bg, fg } = ctx._lastRowColumnColor;
    if (bg !== null) {
      cell.style.setProperty('color', fg ?? 'white', 'important');
      cell.style.setProperty('background-color', bg, 'important');
    }
    return;
  }

  let worstState = -1;
  let worstBg: string | null = null;
  let worstFg: string | null = null;

  for (const k of ctx.rowColumnColorColumnIndices) {
    const s = ctx.dtData.Columns[k]?.columnStyles?.[0];
    if (!s) { continue; }
    const cellEntry = flatRow[k];
    if (typeof cellEntry !== 'object' || cellEntry === null) { continue; }
    const colorData = getCellColors(s, cellEntry as FormattedColumnValue);
    if (colorData?.bgColorIndex !== null && colorData?.bgColorIndex !== undefined) {
      const state = s.metricStyle?.thresholds?.[colorData.bgColorIndex]?.state ?? colorData.bgColorIndex;
      if (state > worstState) {
        worstState = state;
        worstBg = colorData.bgColor;
        worstFg = colorData.color;
      }
    }
  }

  ctx._lastRowColumnColor = { rowIndex, bg: worstBg, fg: worstFg };

  if (worstBg !== null) {
    cell.style.setProperty('color', worstFg ?? 'white', 'important');
    cell.style.setProperty('background-color', worstBg, 'important');
  }
}

/**
 * DataTables `createdCell` callback for a column def.
 * Applies panel-level styles (font-size, row-number alignment), row coloring,
 * and per-column styles (clickthrough HTML, metric colors, alignment).
 * `$` must be available as a global (provided by DataTables bundle at runtime;
 * set global.$ in tests).
 */
export function applyCreatedCell(
  ctx: CreatedCellContext,
  cell: HTMLElement,
  _cellData: unknown,
  rowData: FlatRow,
  rowIndex: number,
  colIndex: number,
): void {
  const $cell = $(cell);
  if (ctx.rowNumbersEnabled && colIndex === 0) {
    $cell.css('text-align', 'center');
  }
  $cell.css('font-size', ctx.fontSizePercent);

  const aRow = ctx.dtData.Rows[rowIndex];
  applyRowColor(cell, aRow, rowIndex, ctx);
  applyRowColumnColor(cell, aRow, rowIndex, colIndex, ctx);

  const aColumn = ctx.dtData.Columns[colIndex];
  if (!aColumn || aColumn.columnStyles.length === 0) {
    return;
  }
  const cellContent = $cell.html();
  if (cellContent === null || rowData === null) {
    return;
  }
  if (!aRow) {
    return;
  }
  const cellEntry = aRow[colIndex];
  if (typeof cellEntry !== 'object' || cellEntry === null) {
    return;
  }
  const cellValueFormatted = cellEntry as FormattedColumnValue;
  const aStyle = aColumn.columnStyles[0];

  if (aStyle.activeStyle === ColumnStyles.STRING) {
    const newHtml = processStringValueStyle(aStyle, rowData, cellValueFormatted, ctx.timeRange, ctx.replaceVariables);
    if (newHtml !== null) {
      $cell.html(newHtml);
    }
  }

  if (aStyle.activeStyle === ColumnStyles.METRIC) {
    // RowColumn coloring is applied above via applyRowColumnColor (FlatRow scan).
    const metricColors = computeMetricCellColors(aStyle, cellValueFormatted);
    if (metricColors.color !== undefined) {
      $cell.css('color', metricColors.color);
    }
    if (metricColors.bgColor !== undefined) {
      $cell.css('background-color', metricColors.bgColor);
    }
  }

  const alignment = computeCellAlignment(aStyle);
  if (alignment !== null) {
    $cell.css('text-align', alignment);
  }
}
