import { CellMetaSettings } from 'datatables.net';
import { InterpolateFunction, TimeRange } from '@grafana/data';
import {
  ColumnStyleColoring,
  ColumnStyles,
  DTData,
  FlatRow,
  FormattedColumnValue,
} from 'types';
import { getCellColors } from './cellColors';
import { computeCellAlignment, computeMetricCellColors } from './cellStyleComputer';
import { processRowColumnStyle, processStringValueStyle } from './createdCellHelpers';

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
 * index (worst state) wins — consistent with how DataTables renders ordering.
 */
function applyRowColor(cell: HTMLElement, flatRow: FlatRow | undefined, dtData: DTData, rowColorColumnIndices: number[]): void {
  // No Row-mode columns — nothing to do.
  if (rowColorColumnIndices.length === 0) { return; }
  if (!flatRow) { return; }

  let worstColorIndex = -1;
  let worstBg: string | null = null;
  let worstFg: string | null = null;

  // Only iterate the pre-identified Row-mode column indices (usually 1),
  // not all columns, keeping this O(k) where k << total column count.
  for (const k of rowColorColumnIndices) {
    const col = dtData.Columns[k];
    const s = col.columnStyles[0];
    const cellEntry = flatRow[k];
    if (typeof cellEntry !== 'object' || cellEntry === null) { continue; }
    const colorData = getCellColors(s, cellEntry as FormattedColumnValue);
    if (colorData?.bgColorIndex !== null && colorData?.bgColorIndex !== undefined && colorData.bgColorIndex > worstColorIndex) {
      worstColorIndex = colorData.bgColorIndex;
      worstBg = colorData.bgColor;
      worstFg = colorData.color;
    }
  }

  if (worstBg) {
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
  applyRowColor(cell, aRow, ctx.dtData, ctx.rowColorColumnIndices);

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
    const colorMode = aStyle.metricStyle.colorMode;
    // Row coloring is handled above (the FlatRow scan before guards) for all cells.
    if (colorMode === ColumnStyleColoring.RowColumn) {
      processRowColumnStyle(cell, rowData, ctx.dtData.Columns);
    }
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
