import { CellMetaSettings } from 'datatables.net';
import { InterpolateFunction, TimeRange } from '@grafana/data';
import {
  ColumnStyleColoring,
  ColumnStyles,
  DTData,
  FlatRow,
  FormattedColumnValue,
} from 'types';
import { computeCellAlignment, computeMetricCellColors } from './cellStyleComputer';
import { processRowColumnStyle, processRowStyle, ProcessStringValueStyle } from './createdCellHelpers';

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

  // Apply row color stored by processRowStyle for cells created after the METRIC
  // column's createdCell fired (e.g. columns to the right of the status column).
  const rowColorData = $(cell.parentNode as HTMLElement).data('dt-row-color') as { bg: string; fg: string } | undefined;
  if (rowColorData) {
    $cell.css('color', rowColorData.fg + ' !important');
    $cell.css('background-color', rowColorData.bg + ' !important');
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
    const newHtml = ProcessStringValueStyle(aStyle, rowData, cellValueFormatted, ctx.timeRange, ctx.replaceVariables);
    if (newHtml !== null) {
      $cell.html(newHtml);
    }
  }

  if (aStyle.activeStyle === ColumnStyles.METRIC) {
    const colorMode = aStyle.metricStyle.colorMode;
    if (colorMode === ColumnStyleColoring.Row) {
      processRowStyle(cell, rowData, ctx.dtData);
    }
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
