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
 * DataTables `createdCell` callback for a column def.
 * Applies font-size, threshold colors, string HTML, and alignment to the cell.
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

  // Apply row coloring: scan all columns for the METRIC/Row column with the
  // worst threshold and apply it to THIS cell now. Using ctx.dtData.Rows[rowIndex]
  // (our FlatRow) avoids DataTables' internal rowData representation which may
  // be a NamedRow (object) where numeric indexing returns undefined.
  const flatRowForColor = ctx.dtData.Rows[rowIndex];
  if (flatRowForColor) {
    let worstColorIndex = -1;
    let worstBg: string | null = null;
    let worstFg: string | null = null;
    for (let k = 0; k < ctx.dtData.Columns.length; k++) {
      const col = ctx.dtData.Columns[k];
      if (!col.columnStyles?.length) { continue; }
      const s = col.columnStyles[0];
      if (s.activeStyle !== ColumnStyles.METRIC) { continue; }
      if (!s.metricStyle) { continue; }
      if (s.metricStyle.colorMode !== ColumnStyleColoring.Row) { continue; }
      const cellEntry = flatRowForColor[k];
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

  const aColumn = ctx.dtData.Columns[colIndex];
  if (!aColumn || aColumn.columnStyles.length === 0) {
    return;
  }
  const cellContent = $(cell).html();
  if (cellContent === null || rowData === null) {
    return;
  }
  const aRow = ctx.dtData.Rows[rowIndex];
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
