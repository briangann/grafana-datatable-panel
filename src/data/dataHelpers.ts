// FieldType across runtimes are not working
import {
  DataFrame,
  Field,
  FieldType,
  GrafanaTheme2,
  TimeRange
} from '@grafana/data';
import { FormatColumnValue } from 'data/cellRenderer';
import { ApplyGrafanaOverrides } from './overrides';
import { ConfigColumnDefs } from 'datatables.net';
import { ColumnStyleColoring, ColumnStyleType } from 'types';
import { DTColumnType, FormattedColumnValue } from './types';
import { ColumnStyleItemType } from 'components/options/columnstyles/types';
import { ApplyColumnStyles } from './columnStyles';
import { DTData } from 'components/DataTablePanel';
import { processRowColumnStyle, processRowStyle, ProcessStringValueStyle } from './createdCellHelpers';

function normalizeFieldName(field: string) {
  return field
    .replace(/ /g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();
}

export const DataFrameToDisplay = (frames: DataFrame[]) => {
  const frame = frames[0];
  const valueFields: Field[] = [];
  let newestTimestamp = 0;
  for (const aField of frame.fields) {
    if (aField.type === FieldType.number) {
      valueFields.push(aField);
    }
    else if (aField.type === FieldType.time) {
      // get the "newest" timestamp from data
      // check if timestamp is 0
      let timestampIndex = aField.values.length - 1;
      let aTimestamp = aField.values[timestampIndex];
      if (newestTimestamp === 0) {
        newestTimestamp = aTimestamp;
      }
      // check if data timestamp is newer
      if (aTimestamp > newestTimestamp) {
        newestTimestamp = aTimestamp;
      }
    }
  }
  if (newestTimestamp === 0) {
    // use current time if none is found
    newestTimestamp = new Date().getTime()
  }
};


export const ConvertDataFrameToDataTableFormat = (
  dataFrames: DataFrame[],
  userTimeZone: string,
  timeRange: TimeRange,
  alignNumbersToRightEnabled: boolean,
  rowNumbersEnabled: boolean,
  columnStyles: ColumnStyleItemType[],
  theme: GrafanaTheme2): { columns: DTColumnType[]; rows: any[] } => {
  DataFrameToDisplay(dataFrames);
  dataFrames = ApplyGrafanaOverrides(dataFrames, theme);
  const dataFrame = dataFrames[0];
  let columns: DTColumnType[] = dataFrame.fields.map((field) => {
    const columnClassName = getColumnClassName(alignNumbersToRightEnabled, field.type as string)
    return {
      title: field.name,
      data: normalizeFieldName(field.name),
      type: field.type as string,
      className: columnClassName,
      fieldConfig: field.config,
      columnStyle: null,
      widthHint: '',
      visible: true,
    };
  });
  ApplyColumnStyles(columns, columnStyles);

  const rows = [] as any[];

  for (let i = 0; i < dataFrame.length; i++) {
    const row = {};
    for (let j = 0; j < columns.length; j++) {
      const aColumn = columns[j];
      const frameFields = dataFrame.fields[j];
      let value = frameFields.values[i];
      const valueType = frameFields.type;
      value = FormatColumnValue(userTimeZone, aColumn.columnStyle, frameFields, j, i, value, valueType, theme);
      const colName = columns[j].data;
      // @ts-ignore
      row[colName] = value;
    }
    rows.push(row as any);
  }
  if (rowNumbersEnabled) {
    columns.unshift({
      title: 'Row',
      data: 'rowNumber',
      type: 'number',
      className: '',
      fieldConfig: {},
      columnStyle: null,
      widthHint: '',
      visible: true,
    });
    for (let i = 0; i < dataFrame.length; i++) {
      // @ts-ignore
      rows[i].rowNumber = i;
    }
    // hide columns
    for (let index = 0; index < columns.length; index++) {
      const element = columns[index];
      if (element.columnStyle?.styleItemType === ColumnStyleType.Hidden) {
        element.visible = false;
      }
    }
  }

  return { columns, rows };
}

export const BuildColumnDefs = (
  emptyDataEnabled: boolean,
  emptyDataText: string,
  rowNumbersEnabled: boolean,
  fontSizePercent: string,
  alignNumbersToRightEnabled: boolean,
  timeRange: TimeRange,
  dtData: DTData): ConfigColumnDefs[] => {

  const columnDefs: ConfigColumnDefs[] = [];
  let rowNumberOffset = 0;
  for (let i = 0; i < dtData.Columns.length; i++) {
    let columnType = dtData.Columns[i].type!;
    let columnClassName = getColumnClassName(alignNumbersToRightEnabled, columnType)
    // column type "date" is very limited, and overrides our formatting
    // best to use our format, then the "raw" epoch time as the sort ordering field
    // https://datatables.net/reference/option/columns.type
    if (columnType === 'time') {
      columnType = 'number';
    }
    if (columnType === 'number' && alignNumbersToRightEnabled) {
      columnClassName = 'dt-right'; // any reason not to align numbers right?
    }
    // if we did not get a type prop from grafana at all,
    // check at least if it's a number to have DT sort properly
    if (columnType !== undefined && dtData.Rows[0] && (typeof dtData.Rows[0][i]) === 'number') {
      columnType = 'number';
    }

    dtData.Columns[i].className = columnClassName;
    // NOTE: the width below is a "hint" and will be overridden as needed,
    // this lets most tables show timestamps with full width
    const columnDefDict: any = {
      width: dtData.Columns[i].widthHint,
      targets: i + rowNumberOffset,
      defaultContent: dtData.Columns,
      //defaultContent: emptyDataEnabled ? emptyDataText : '',
      data: function (row: any, type: any, set: any, meta: any) {
        if (type === undefined) {
          return null;
        }
        const idx = meta.col;
        if (row[idx]?.display !== undefined) {
          return row[idx].display;
        }
        return null;
      },
      render: function (data: any, type: any, val: any, meta: any) {
        if (type === undefined) {
          return null;
        }
        const aColumn = dtData.Columns[meta.col];
        if (aColumn === undefined) {
          return null;
        }
        const idx = meta.col;
        if (type === 'type') {
          return val[idx];
        }
        let returnValue = val[meta.col];
        if (returnValue.valueFormatted) {
          return returnValue.valueFormatted;
        }
        return returnValue;
      },
      createdCell: function(cell: any, columnsInCellData: DTColumnType[], rowData: any, rowIndex: number, colIndex: number) {
        // cellData is populated with Columns, which we can use for content thresholds
        const aColumn = columnsInCellData[colIndex];
        // no formatting needed without a style
        if (aColumn.columnStyle === null) {
          return;
        }
        const colorMode = aColumn.columnStyle.colorMode;
        // set the fontsize for the cell
        $(cell).css('font-size', fontSizePercent);
        // orthogonal sort requires getting cell data differently
        const cellContent = $(cell).html();
        // hidden columns have null data
        if (cellContent === null || rowData === null) {
          return;
        }
        // undefined types should have numerical data, any others are already formatted
        let actualColumn = colIndex;
        if (rowNumbersEnabled) {
          actualColumn -= 1;
        }
        // instead of using cellContent, use the formatted data from dtData.Rows
        const aRow = dtData.Rows[rowIndex];
        const cellValueFormatted = aRow[colIndex] as FormattedColumnValue;

        //
        // There are 4 style types
        // Metric
        //    this has thresholds with 4 color modes
        // String (url etc)
        // Date
        // Hidden
        //
        // TODO: speed this up by checking the cell type first
        // if it is a string...
        if (typeof aRow[colIndex].valueRaw === 'string') {
          const clickThrough = ProcessStringValueStyle(aColumn.columnStyle, columnsInCellData, rowData, rowIndex, cellValueFormatted, timeRange);
          if (clickThrough !== null) {
            console.log(`${clickThrough}`);
            // eslint-disable-next-line no-debugger
            debugger;
            // now update the cell with the link
            const newCell = '<a href="' + clickThrough + '" target="_blank">' + cellContent + '</a>';
            $(cell).html(newCell);
          }
        }

        /*
         * this mode will produce the "worst" threshold for all of the metrics in the row
         * that have thresholds set
        */
        if (colorMode === ColumnStyleColoring.Row) {
          processRowStyle(cell, rowData, dtData, rowNumberOffset);
        }

        /**
         * This mode highlights the entire row and applies the threshold color to each cell
         */
        if (colorMode === ColumnStyleColoring.RowColumn) {
          processRowColumnStyle(cell, rowData, columnsInCellData, rowNumbersEnabled, rowNumberOffset);
        }

        // Process cell coloring
        // Two scenarios:
        //    1) Cell coloring is enabled, the above row color is skipped
        //    2) RowColumn is enabled, the above row color is process, but we also
        //    set the cell colors individually
        //
        const colorData = getCellColors(aColumn.columnStyle, actualColumn, cellValueFormatted);
        if (!colorData) {
          return;
        }
        if (colorMode === 'cell' || colorMode === 'row-column') {
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
      },
    };
    //let ignoreNullValues = this.getColumnIgnoreNullValue(i);
    //if (ignoreNullValues) {
    //  columnDefDict.defaultContent = '-';
    //}
          // hide columns that are marked hidden
    // for (let i = 0; i < aColumn.Columns.length; i++) {
    //   if (cachedProcessedData.Columns[i].hidden) {
    //     newDT.column(i + rowNumberOffset).visible(false);
    //   }
    // }
    //let ignoreNullValues = this.getColumnIgnoreNullValue(i);
    //if (ignoreNullValues) {
    //  columnDefDict.defaultContent = '-';
    //}

    columnDefs.push(columnDefDict);
  }
  return columnDefs;
};

const getColumnClassName = (alignNumbersToRightEnabled: boolean, columnType: string) => {
  let columnClassName = '';

  // column type "date" is very limited, and overrides our formatting
  // best to use our format, then the "raw" epoch time as the sort ordering field
  // https://datatables.net/reference/option/columns.type
  if (columnType === 'time') {
    columnType = 'number';
  }
  if (columnType === 'number' && alignNumbersToRightEnabled) {
    columnClassName = 'dt-right'; // any reason not to align numbers right?
  }
  if (columnType === 'string') {
    columnClassName = 'dt-right';
  }
  return columnClassName;
}

export const getCellColors = (aColumnStyle: ColumnStyleItemType | null, columnNumber: any, cellData: FormattedColumnValue) => {
  if (aColumnStyle === null || cellData === null || cellData === undefined) {
    return null;
  }
  // only color cell if the content is a number
  if (aColumnStyle.styleItemType !== ColumnStyleType.Metric) {
    return null;
  }
  // let useData = cellData;
  // if (cellData.valueRaw) {
  //   useData = cellData.valueRaw;
  // } else {
  //   // this should not happen
  //   return null;
  // }
  //const items = useData.valueFormatted.split(/([^0-9.,]+)/);
  let bgColor = null;
  let bgColorIndex = null;
  let color = null;
  let colorIndex = null;
  //let value = null;
  // check if the content has a numeric value after the split
  // if (!isNaN(Number(cellData.valueFormatted))) {
  //   value = parseFloat(items[0].replace(',', '.'));
  // }

  if (aColumnStyle && aColumnStyle.colorMode != null && aColumnStyle.thresholds.length > 0) {
    // check color for either cell or row
    if (aColumnStyle.colorMode === ColumnStyleColoring.Cell ||
      aColumnStyle.colorMode === ColumnStyleColoring.Row ||
      aColumnStyle.colorMode === ColumnStyleColoring.RowColumn) {
      if (cellData.valueRaw !== null && !isNaN(cellData.valueRaw as number)) {
        bgColor = GetColorForValue(cellData.valueRaw as number, aColumnStyle);
        bgColorIndex = GetColorIndexForValue(cellData.valueRaw as number, aColumnStyle);
      }
      color = 'white';
    }
    // just the value color is set
    if (aColumnStyle.colorMode === ColumnStyleColoring.Value) {
      if (cellData.valueRaw !== null && !isNaN(cellData.valueRaw as number)) {
        color = GetColorForValue(cellData.valueRaw as number, aColumnStyle);
        colorIndex = GetColorIndexForValue(cellData.valueRaw, aColumnStyle);
      }
    }
  }
  return {
    bgColor: bgColor,
    bgColorIndex: bgColorIndex,
    color: color,
    colorIndex: colorIndex,
  };
};

export const GetColorForValue = (value: number, style: ColumnStyleItemType) => {
  if (!style.thresholds) {
    return null;
  }
  let color = style.thresholds[0].color;
  for (let i = style.thresholds.length - 1; i > 0; i--) {
    const checkValue = style.thresholds[i].value;
    if (value >= checkValue) {
      color = style.thresholds[i].color;
      // found highest match
      break;
    }
  }
  return color;
};

// to determine the overall row color, the index of the threshold is needed
export const GetColorIndexForValue = (value: any, style: any) => {
  if (!style.thresholds) {
    return null;
  }
  let colorIndex = 0;
  for (let i = style.thresholds.length - 1; i > 0; i--) {
    if (value >= style.thresholds[i].value) {
      colorIndex = i;
      break;
    }
  }
  return colorIndex;
};
