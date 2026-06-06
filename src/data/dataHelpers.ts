import {
  DataFrame,
  FieldConfigSource,
  GrafanaTheme2,
  InterpolateFunction,
  TimeRange
} from '@grafana/data';
import { getCellColors } from './cells/cellColors';
import { FormatColumnValue } from './cells/cellRenderer';
import { ApplyGrafanaOverrides } from './mappings/overrides';
import { CellMetaSettings, ConfigColumnDefs } from 'datatables.net';
import { ColumnAlignment, ColumnAlignmentOptions, ColumnStyleColoring, ColumnStyleItemType, ColumnStyles, DTColumnType, DTData, FormattedColumnValue } from 'types';
import { ApplyColumnStyles } from './columns/columnStyles';
import { processRowColumnStyle, processRowStyle, ProcessStringValueStyle } from './cells/createdCellHelpers';
import { ApplyMappings, GetMappings } from './mappings/mappingProcessor';

export function normalizeFieldName(field: string) {
  return field
    .replace(/ /g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();
}

type AlignmentFlags = {
  numbers: boolean;
  strings: boolean;
};

type ConvertDataFrameOptions = {
  dataFrames: DataFrame[];
  fieldConfig: FieldConfigSource<any>;
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
      const aColumn = columns[j];
      const frameFields = dataFrame.fields[j];
      const rawValue = frameFields.values[i];
      const valueType = frameFields.type;
      let value: FormattedColumnValue;
      if (aColumn.columnStyles && aColumn.columnStyles.length > 0) {
        // A column style is configured — delegate all formatting to FormatColumnValue.
        value = FormatColumnValue(userTimeZone, aColumn.columnStyles[0], frameFields, rawValue, valueType);
      } else {
        // No column style. Wrap the raw value in a minimal FormattedColumnValue so that
        // ApplyMappings (which requires .valueRaw) can run. Do NOT call FormatColumnValue
        // here: for time fields that would apply the plugin's default date format string,
        // overriding whatever the user has already configured via Grafana field overrides.
        value = { valueRaw: rawValue, valueFormatted: String(rawValue ?? ''), valueRounded: null, valueRoundedAndFormatted: null };
      }
      const mappings = columnMappings[j];
      if (mappings && mappings.length > 0) {
        const mappedValue = ApplyMappings(value, mappings);
        if (mappedValue !== null) {
          value = mappedValue;
        }
      }
      const colName = columns[j].data;
      row[colName] = value;
    }
    rows.push(row);
  }
  if (rowNumbersEnabled) {
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
    for (let i = 0; i < dataFrame.length; i++) {
      rows[i].rowNumber = i + 1;
    }
  }
  // Mark hidden columns — runs unconditionally so hidden styles work
  // regardless of whether row numbers are enabled.
  for (let index = 0; index < columns.length; index++) {
    const aCell = columns[index];
    if (aCell.columnStyles && aCell.columnStyles.length > 0) {
      const aStyle = aCell.columnStyles[0];
      if (aStyle.activeStyle === ColumnStyles.HIDDEN) {
        aCell.visible = false;
      }
    }
  }

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
    const columnDefDict: any = {
      width: dtData.Columns[i].widthHint,
      targets: i,
      defaultContent: '-',
      // Emit the coerced type so DataTables uses our intended sort algorithm.
      // Time columns are coerced to 'number' above so DataTables sorts by epoch
      // value rather than its own date parser, which conflicts with our formatting.
      ...(columnType && { type: columnType }),
      render: function (_data: any, type: any, val: any[], meta: CellMetaSettings) {
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
        if (returnValue && returnValue?.valueFormatted) {
          if (type === 'sort') {
            return returnValue.valueRaw;
          }
          if (type === 'filter') {
            // WYSIWYG: filter against the displayed value so users match
            // what they see in the cell (e.g. "5.00" with decimals/units)
            // rather than the underlying numeric value.
            return returnValue.valueFormatted;
          }
          // all others get the formatted value
          return returnValue.valueFormatted;
        }
        // the Row column is using just numerics, no formatting
        return returnValue;
      },
      createdCell: function (cell: any, columnsInCellData: DTColumnType[], rowData: any, rowIndex: number, colIndex: number) {
        // always center the row number column
        if (rowNumbersEnabled && colIndex === 0) {
          $(cell).css('text-align', 'center');
        }
        // set the fontsize for the cell
        $(cell).css('font-size', fontSizePercent);

        // cellData is populated with Columns, which we can use for content thresholds
        if (columnsInCellData === null) {
          return;
        }
        const aColumn = columnsInCellData[colIndex];
        // no formatting needed without a style
        if (!aColumn || aColumn?.columnStyles.length === 0) {
          return;
        }
        // orthogonal sort requires getting cell data differently
        const cellContent = $(cell).html();
        // hidden columns have null data
        if (cellContent === null || rowData === null) {
          return;
        }
        // instead of using cellContent, use the formatted data from dtData.Rows
        const aRow = dtData.Rows[rowIndex];
        // updating data in the editor can cause the rows to change before we are done processing, return if a row cannot be found
        if (!aRow) {
          return;
        }
        const cellValueFormatted = aRow[colIndex] as FormattedColumnValue;

        //
        // There are 4 style types
        // Metric
        //    this has thresholds with 4 color modes
        // String (url etc)
        // Date (processed elsewhere)
        // Hidden (processed elsewhere)
        //
        const aStyle = aColumn.columnStyles[0];
        if (aStyle.activeStyle === ColumnStyles.STRING) {
          const newCell = ProcessStringValueStyle(
            aStyle,
            rowData,
            cellValueFormatted,
            timeRange,
            replaceVariables,
          );
          if (newCell !== null) {
            $(cell).html(newCell);
          }
        }
        /*
         * this mode will produce the "worst" threshold for all of the metrics in the row
         * that have thresholds set
        */
        if (aStyle.activeStyle === ColumnStyles.METRIC) {
          const colorMode = aStyle.metricStyle.colorMode;
          // Produces the "worst" threshold color across all metrics in the row.
          if (colorMode === ColumnStyleColoring.Row) {
            processRowStyle(cell, rowData, dtData, 0);
          }
          // Highlights the entire row AND applies the threshold color to each cell individually.
          if (colorMode === ColumnStyleColoring.RowColumn) {
            processRowColumnStyle(cell, rowData, columnsInCellData, 0);
          }
          // Process cell coloring
          // Two scenarios:
          //    1) Cell coloring is enabled, the above row color is skipped
          //    2) RowColumn is enabled, the above row color is process, but we also
          //    set the cell colors individually
          //
          let colorData: any;
          colorData = getCellColors(aStyle, cellValueFormatted);
          if (!colorData) {
            return;
          }
          if (colorMode === ColumnStyleColoring.Cell || colorMode === ColumnStyleColoring.RowColumn) {
            if (colorData && colorData.color !== null) {
              $(cell).css('color', colorData.color);
            }
            if (colorData && colorData.bgColor !== null) {
              $(cell).css('background-color', colorData.bgColor);
            }
          } else if (colorData.color) {
            if (colorData && colorData.color !== null) {
              $(cell).css('color', colorData.color);
            }
          }
        }

        // Per-column alignment override — wins over the DataTables class set via getColumnClassName.
        // Whitelist against the known enum so hand-crafted panel JSON can't feed arbitrary strings
        // into jQuery's .css(). Not a present-day exploit (browsers reject invalid text-align) but
        // cheap defense-in-depth at a boundary that reads user-controlled data.
        if (
          aStyle.align &&
          aStyle.align !== ColumnAlignment.DEFAULT &&
          ColumnAlignmentOptions.some((o) => o.value === aStyle.align)
        ) {
          $(cell).css('text-align', aStyle.align);
        }
      },
    };
    // Apply visibility: ConvertDataFrameToDataTableFormat sets column.visible=false
    // for HIDDEN column styles. Propagate that flag to the DataTables column def so
    // the column is actually hidden in the rendered table.
    if (!dtData.Columns[i].visible) {
      columnDefDict.visible = false;
    }
    columnDefs.push(columnDefDict);
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

