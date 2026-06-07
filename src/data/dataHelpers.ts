import {
  DataFrame,
  Field,
  FieldConfigSource,
  GrafanaTheme2,
  InterpolateFunction,
  TimeRange
} from '@grafana/data';
import { computeCellAlignment, computeMetricCellColors } from './cells/cellStyleComputer';
import { FormatColumnValue } from './cells/cellRenderer';
import { ApplyGrafanaOverrides } from './mappings/overrides';
import { CellMetaSettings, ConfigColumnDefs } from 'datatables.net';
import { ColumnStyleColoring, ColumnStyleItemType, ColumnStyles, DTColumnType, DTData, FormattedColumnValue } from 'types';
import { ApplyColumnStyles } from './columns/columnStyles';
import { processRowColumnStyle, processRowStyle, ProcessStringValueStyle } from './cells/createdCellHelpers';
import { ApplyMappings, GetMappings } from './mappings/mappingProcessor';

export function normalizeFieldName(field: string) {
  return field
    .replace(/ /g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();
}

/** Wraps a raw cell value in a minimal FormattedColumnValue.
 *
 * Used when no column style is configured. Does NOT call FormatColumnValue so
 * that time fields honor Grafana field overrides instead of the plugin's own
 * date format string.
 */
export function wrapRawValue(rawValue: unknown): FormattedColumnValue {
  return {
    valueRaw: rawValue as FormattedColumnValue['valueRaw'],
    valueFormatted: rawValue != null && typeof rawValue !== 'object' ? String(rawValue) : '',
    valueRounded: null,
    valueRoundedAndFormatted: null,
  };
}

/** Resolves the final FormattedColumnValue for one cell.
 *
 * When a column style is present, delegates to FormatColumnValue.
 * Otherwise wraps the raw value via wrapRawValue.
 * Pre-computed mappings (stable per column) are applied after either path.
 */
export function resolveColumnValue(
  userTimeZone: string,
  aColumn: DTColumnType,
  frameField: Field,
  rawValue: unknown,
  valueType: string,
  mappings: ReturnType<typeof GetMappings>,
): FormattedColumnValue {
  let value: FormattedColumnValue;
  if (aColumn.columnStyles && aColumn.columnStyles.length > 0) {
    value = FormatColumnValue(userTimeZone, aColumn.columnStyles[0], frameField, rawValue, valueType);
  } else {
    value = wrapRawValue(rawValue);
  }
  if (mappings && mappings.length > 0) {
    const mappedValue = ApplyMappings(value, mappings);
    if (mappedValue !== null) {
      value = mappedValue;
    }
  }
  return value;
}

/** Marks columns as not visible when their first style is HIDDEN.
 *
 * Runs unconditionally so hidden styles work regardless of whether row
 * numbers are enabled.
 */
export function markHiddenColumns(columns: DTColumnType[]): void {
  for (const aCell of columns) {
    if (aCell.columnStyles?.length > 0 && aCell.columnStyles[0].activeStyle === ColumnStyles.HIDDEN) {
      aCell.visible = false;
    }
  }
}

/** Prepends a row-number column and stamps 1-based indices on every row. */
export function prependRowNumbers(
  columns: DTColumnType[],
  rows: Array<Record<string, FormattedColumnValue | number>>,
): void {
  columns.unshift({
    title: 'row',
    data: 'rowNumber',
    type: 'number',
    className: '',
    fieldConfig: {},
    columnStyles: [],
    widthHint: '1%',
    visible: true,
  });
  for (let i = 0; i < rows.length; i++) {
    rows[i].rowNumber = i + 1;
  }
}

type AlignmentFlags = {
  numbers: boolean;
  strings: boolean;
};

type ConvertDataFrameOptions = {
  dataFrames: DataFrame[];
  fieldConfig: FieldConfigSource;
  userTimeZone: string;
  alignment: AlignmentFlags;
  rowNumbersEnabled: boolean;
  columnStyles: ColumnStyleItemType[];
  theme: GrafanaTheme2;
  replaceVariables: InterpolateFunction;
};

export const ConvertDataFrameToDataTableFormat = (
  opts: ConvertDataFrameOptions,
): { columns: DTColumnType[]; rows: Array<Record<string, FormattedColumnValue | number>> } => {
  const { fieldConfig, userTimeZone, alignment, rowNumbersEnabled, columnStyles, theme, replaceVariables } = opts;
  const dataFrames = ApplyGrafanaOverrides(opts.dataFrames, theme, replaceVariables);
  const dataFrame = dataFrames[0];
  let columns: DTColumnType[] = dataFrame.fields.map((field) => {
    const columnClassName = getColumnClassName(alignment, field.type as string);
    return {
      title: field.name,
      data: normalizeFieldName(field.name),
      type: field.type as string,
      className: columnClassName,
      fieldConfig: field.config,
      columnStyles: [],
      widthHint: '',
      visible: true,
    };
  });
  ApplyColumnStyles(columns, columnStyles);

  // Pre-compute per-column mappings once — they are stable across rows.
  // Moving this outside the row loop reduces calls from O(rows × cols) to O(cols).
  const columnMappings = columns.map((aColumn) =>
    GetMappings(fieldConfig.defaults.mappings, aColumn.fieldConfig?.mappings)
  );

  const rows: Array<Record<string, FormattedColumnValue | number>> = [];

  for (let i = 0; i < dataFrame.length; i++) {
    const row: Record<string, FormattedColumnValue | number> = {};
    for (let j = 0; j < columns.length; j++) {
      const frameField = dataFrame.fields[j];
      const aColumn = columns[j];
      row[aColumn.data] = resolveColumnValue(
        userTimeZone,
        aColumn,
        frameField,
        frameField.values[i],
        frameField.type,
        columnMappings[j],
      );
    }
    rows.push(row);
  }
  if (rowNumbersEnabled) {
    prependRowNumbers(columns, rows);
  }
  // Mark hidden columns — runs unconditionally so hidden styles work
  // regardless of whether row numbers are enabled.
  markHiddenColumns(columns);

  return { columns, rows };
}

type BuildColumnDefsOptions = {
  rowNumbersEnabled: boolean;
  fontSizePercent: string;
  alignment: AlignmentFlags;
  timeRange: TimeRange;
  replaceVariables: InterpolateFunction;
  dtData: DTData;
};

export const BuildColumnDefs = (opts: BuildColumnDefsOptions): ConfigColumnDefs[] => {
  const {
    rowNumbersEnabled,
    fontSizePercent,
    alignment,
    timeRange,
    replaceVariables,
    dtData,
  } = opts;

  const columnDefs: ConfigColumnDefs[] = [];
  for (let i = 0; i < dtData.Columns.length; i++) {
    let columnType = dtData.Columns[i].type!;
    let columnClassName = getColumnClassName(alignment, columnType);
    // DataTables' built-in "date" type overrides our formatting; coerce to "number"
    // so DataTables sorts by the raw epoch value while we control display.
    // https://datatables.net/reference/option/columns.type
    if (columnType === 'time') {
      columnType = 'number';
    }
    if (columnType === 'number' && alignment.numbers) {
      columnClassName = 'dt-right';
    }

    dtData.Columns[i].className = columnClassName;
    // NOTE: the width below is a "hint" and will be overridden as needed;
    // this lets most tables show timestamps at full width.
    const columnDefDict: Record<string, unknown> = {
      width: dtData.Columns[i].widthHint,
      targets: i,
      defaultContent: '-',
      // Emit the coerced type so DataTables uses our intended sort algorithm.
      // Time columns are coerced to 'number' above so DataTables sorts by epoch
      // value rather than its own date parser, which conflicts with our formatting.
      ...(columnType && { type: columnType }),
      render: function (_data: unknown, type: string | undefined, val: Array<FormattedColumnValue | number>, meta: CellMetaSettings) {
        if (type === undefined) {
          return null;
        }
        const aColumn = dtData.Columns[meta.col];
        if (aColumn === undefined) {
          return null;
        }
        const idx = meta.col;
        let returnValue = val[idx];
        if (type === 'type') {
          // returns the whole object
          return returnValue;
        }
        // Use shape detection rather than truthiness: valueFormatted may be '' (for null/object
        // raw values), which is falsy. A truthiness check would fall through and return the raw
        // FormattedColumnValue object, causing DataTables to render '[object Object]'.
        if (returnValue !== null && typeof returnValue === 'object' && 'valueFormatted' in returnValue) {
          if (type === 'sort') {
            return returnValue.valueRaw;
          }
          if (type === 'filter') {
            // WYSIWYG: filter against the displayed value so users match
            // what they see in the cell (e.g. "5.00" with decimals/units)
            // rather than the underlying numeric value.
            return returnValue.valueFormatted;
          }
          // display and all other types get the formatted value (may be '')
          return returnValue.valueFormatted;
        }
        // the Row column is using just numerics, no formatting
        return returnValue;
      },
      createdCell: function (cell: Node, _cellData: unknown, rowData: unknown, rowIndex: number, colIndex: number) {
        const $cell = $(cell);
        // Always-applied before any guards: row-number centering and font size.
        if (rowNumbersEnabled && colIndex === 0) {
          $cell.css('text-align', 'center');
        }
        $cell.css('font-size', fontSizePercent);

        const aColumn = dtData.Columns[colIndex];
        // No formatting needed without a style.
        if (!aColumn || aColumn.columnStyles.length === 0) {
          return;
        }
        // orthogonal sort requires getting cell data differently
        const cellContent = $(cell).html();
        // hidden columns have null data
        if (cellContent === null || rowData === null) {
          return;
        }
        // Use dtData.Rows (not the DOM content) as the source of truth for cell values.
        const aRow = dtData.Rows[rowIndex];
        // Rows can change during editor interaction; bail if the row is gone.
        if (!aRow) {
          return;
        }
        const cellEntry = aRow[colIndex];
        // Guard against non-object cell values (e.g. the rowNumber column stores a plain number).
        if (typeof cellEntry !== 'object' || cellEntry === null) {
          return;
        }
        const cellValueFormatted = cellEntry as FormattedColumnValue;
        const aStyle = aColumn.columnStyles[0];

        if (aStyle.activeStyle === ColumnStyles.STRING) {
          const newHtml = ProcessStringValueStyle(aStyle, rowData, cellValueFormatted, timeRange, replaceVariables);
          if (newHtml !== null) {
            $cell.html(newHtml);
          }
        }

        if (aStyle.activeStyle === ColumnStyles.METRIC) {
          const colorMode = aStyle.metricStyle.colorMode;
          // Row/RowColumn modes walk sibling DOM nodes — must stay in the callback.
          if (colorMode === ColumnStyleColoring.Row) {
            processRowStyle(cell, rowData, dtData);
          }
          if (colorMode === ColumnStyleColoring.RowColumn) {
            processRowColumnStyle(cell, rowData, dtData.Columns);
          }
          const metricColors = computeMetricCellColors(aStyle, cellValueFormatted);
          if (metricColors.color !== undefined) {
            $cell.css('color', metricColors.color);
          }
          if (metricColors.bgColor !== undefined) {
            $cell.css('background-color', metricColors.bgColor);
          }
        }

        // Per-column alignment override — computeCellAlignment guards the whitelist.
        const alignment = computeCellAlignment(aStyle);
        if (alignment !== null) {
          $cell.css('text-align', alignment);
        }
      },
    };
    // Apply visibility: ConvertDataFrameToDataTableFormat sets column.visible=false
    // for HIDDEN column styles. Propagate that flag to the DataTables column def so
    // the column is actually hidden in the rendered table.
    if (!dtData.Columns[i].visible) {
      columnDefDict.visible = false;
    }
    columnDefs.push(columnDefDict as unknown as ConfigColumnDefs);
  }
  // this prevents the dialog popup when toggling row numbers in the editor
  columnDefs.push(
    {
      "defaultContent": "-",
      "targets": "_all"
    });
  return columnDefs;
};

export const getColumnClassName = (alignment: AlignmentFlags, columnType: string) => {
  let columnClassName = '';

  // column type "date" is very limited, and overrides our formatting
  // best to use our format, then the "raw" epoch time as the sort ordering field
  // https://datatables.net/reference/option/columns.type
  if (columnType === 'time') {
    columnType = 'number';
  }
  if (columnType === 'number' && alignment.numbers) {
    columnClassName = 'dt-right'; // any reason not to align numbers right?
  }
  if (columnType === 'string' && alignment.strings) {
    columnClassName = 'dt-right';
  }
  return columnClassName;
}

