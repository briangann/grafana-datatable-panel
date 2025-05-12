// FieldType across runtimes are not working
import {
  DataFrame,
  Field,
  FieldType,
  GrafanaTheme2
} from '@grafana/data';
import { ApplyUnitsAndDecimals, FormatColumnValue } from 'data/cellRenderer';
import { ApplyGrafanaOverrides } from './overrides';
import { ConfigColumnDefs } from 'datatables.net';
import { ColumnStyleColoring, ColumnStyleType } from 'types';
import { DTColumnType } from './types';
import { ColumnStyleItemType } from 'components/options/columnstyles/types';
import { ApplyColumnStyles } from './columnStyles';
import { DTData } from 'components/DataTablePanel';

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
      if (valueType !== 'string') {
        value = FormatColumnValue(userTimeZone, aColumn.columnStyle, frameFields, j, i, value, valueType, "timeFrom", "timeTo", theme);
      }
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
    });
    for (let i = 0; i < dataFrame.length; i++) {
      // @ts-ignore
      rows[i].rowNumber = i;
    }
  }
  ApplyUnitsAndDecimals(columns, rows);
  return { columns, rows };
}

// const doStuff = (dtColumns: DTColumnType[], cell: any, fontSizePercent: any, colIndex: number) => {
//   // eslint-disable-next-line no-debugger
//   debugger;
//   $(cell).css('font-size', fontSizePercent);
//   //const aColumn = dtColumns[colIndex];
//   let colorMode = dtColumns[colIndex].columnStyle?.colorMode;
//   console.log(colorMode);
// }

export const BuildColumnDefs = (
  emptyDataEnabled: boolean,
  emptyDataText: string,
  rowNumbersEnabled: boolean,
  fontSizePercent: string,
  alignNumbersToRightEnabled: boolean,
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
      defaultContent: emptyDataEnabled ? emptyDataText : '',
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
          console.log('aColumn undefined');
          return null;
        }
        // //console.log(aColumn);
        // let colorMode = aColumn.columnStyle?.colorMode;
        // //console.log(colorMode);
        // if (colorMode === undefined) {
        //   console.log('colorMode undefined');
        //   //return null;
        // }
        // // eslint-disable-next-line no-debugger
        // debugger;
        // TODO: call render function vs just returning formatted value
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
      createdCell: function(cell: any, cellDataAlwaysEmpty: any, rowData: any, rowIndex: number, colIndex: number) {
        // cellData is empty since we use render()
        // eslint-disable-next-line no-debugger
        debugger;
        const aColumn = dtData.Columns[colIndex];
        const colorMode = aColumn.columnStyle?.colorMode;
        console.log(aColumn);
        // set the fontsize for the cell
        $(cell).css('font-size', fontSizePercent);
        // orthogonal sort requires getting cell data differently
        const cellContent = $(cell).html();
        // hidden columns have null data
        if (cellContent === null) {
          return;
        }
        // undefined types should have numerical data, any others are already formatted
        let actualColumn = colIndex;
        if (rowNumbersEnabled) {
          actualColumn -= 1;
        }
        // for coloring rows, get the "worst" threshold
        let rowColor = null;
        let color = null;
        let rowColorIndex = null;
        let rowColorData = null;
        //colorMode = aColumn.columnStyle?.colorMode;
        if (colorMode === ColumnStyleColoring.Row) {
          // run all of the rowData through threshold check, get the "highest" index
          // and use that for the entire row
          if (rowData === null) {
            return;
          }
          rowColorIndex = -1;
          rowColorData = null;
          rowColor = 'teal'; // will stand out with a default like this, useful for debugging
          // this should be configurable...
          color = 'white';
          for (let columnNumber = 0; columnNumber < dtData.Columns.length; columnNumber++) {
            let aColumnStyle = dtData.Columns[columnNumber].columnStyle;
            // need the style to get the color
            if (!aColumnStyle) {
              //console.log(`no style found for column ${columnNumber}`);
              continue;
            }
            // only process color values for numbers
            if (aColumnStyle.styleItemType !== ColumnStyleType.Metric) {
              continue;
            }
            rowColorData = getCellColors(
              aColumnStyle,
              columnNumber,
              rowData[columnNumber + rowNumberOffset]
            );
            if (!rowColorData) {
              continue;
            }

            if (rowColorData.bgColorIndex !== null) {
              if (rowColorData.bgColorIndex > rowColorIndex) {
                rowColorIndex = rowColorData.bgColorIndex;
                rowColor = rowColorData.bgColor;
              }
            }
          }
          // style the entire row (the parent of the td is the tr)
          const fmtColors = 'color: ' + color + ' !important;' +
                'background-color: ' + rowColor + ' !important;';
          $(cell.parentNode)
            .children()
            .attr('style', function(i,s) { return s + fmtColors });
        }

        if (colorMode === ColumnStyleColoring.RowColumn) {
          // run all of the rowData through threshold check, get the "highest" index
          // and use that for the entire row
          if (rowData === null) {
            return;
          }
          rowColorIndex = -1;
          rowColorData = null;
          rowColor = 'blue'; // colorState.rowcolumn;
          // this should be configurable...
          color = 'white';
          for (let columnNumber = 0; columnNumber < dtData.Columns.length; columnNumber++) {
            if (dtData.Columns[columnNumber].type === undefined) {
              if (dtData.Columns[columnNumber].columnStyle !== null) {
                let aColumnStyle = dtData.Columns[columnNumber].columnStyle;
                // need the style to get the color
                if (!aColumnStyle) {
                  //console.log(`no style found for column ${columnNumber}`);
                  continue;
                }
                // only process color values for numbers
                if (aColumnStyle.styleItemType !== ColumnStyleType.Metric) {
                  continue;
                }
                rowColorData = getCellColors(
                  dtData.Columns[columnNumber].columnStyle!,
                  columnNumber,
                  rowData[columnNumber + rowNumberOffset]
                );
              }
              if (!rowColorData) {
                continue;
              }
              if (rowColorData.bgColorIndex !== null) {
                if (rowColorData.bgColorIndex > rowColorIndex) {
                  rowColorIndex = rowColorData.bgColorIndex;
                  rowColor = rowColorData.bgColor;
                }
              }
            }
          }
          // style the rowNumber and Timestamp column
          // the cell colors will be determined in the next phase
          if (dtData.Columns[0].type !== undefined) {
            const children = $(cell.parentNode).children();
            let aChild = children[0];
            $(aChild).css('color', color);
            if (rowColor) {
              $(aChild).css('background-color', rowColor);
            }
            // the 0 column contains the row number, if they are enabled
            // then the above just filled in the color for the row number,
            // now take care of the timestamp
            if (rowNumbersEnabled) {
              aChild = children[1];
              $(aChild).css('color', color);
              if (rowColor) {
                $(aChild).css('background-color', rowColor);
              }
            }
          }
        }

        // Process cell coloring
        // Two scenarios:
        //    1) Cell coloring is enabled, the above row color is skipped
        //    2) RowColumn is enabled, the above row color is process, but we also
        //    set the cell colors individually
        // if (aColumn.columnStyle && aColumn.columnStyle.styleItemType !== ColumnStyleType.Number) {
        //   return;
        // }
        const colorData = getCellColors(aColumn.columnStyle, actualColumn, cellContent);
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
        } else if (colorData.color) { // TODO: fix this
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

const getCellColors = (aColumnStyle: ColumnStyleItemType | null, columnNumber: any, cellData: any) => {
  if (aColumnStyle === null || cellData === null || cellData === undefined) {
    return null;
  }
  let useData = cellData;
  if (cellData.valueRaw) {
    useData = cellData.valueRaw;
    //console.log(`using valueRaw... ${cellData.valueRaw}`);
  } else {
    // this should not happen
    return null;
  }
  const items = useData.split(/([^0-9.,]+)/);
  // only color cell if the content is a number?
  let bgColor = null;
  let bgColorIndex = null;
  let color = null;
  let colorIndex = null;
  let value = null;
  // check if the content has a numeric value after the split
  if (!isNaN(Number(items[0]))) {
    value = parseFloat(items[0].replace(',', '.'));
  }

  if (aColumnStyle && aColumnStyle.colorMode != null && aColumnStyle.thresholds.length > 0) {
    // check color for either cell or row
    if (aColumnStyle.colorMode === ColumnStyleColoring.Cell ||
      aColumnStyle.colorMode === ColumnStyleColoring.Row ||
      aColumnStyle.colorMode === ColumnStyleColoring.RowColumn) {
      if (value !== null && !isNaN(value)) {
        bgColor = GetColorForValue(value, aColumnStyle);
        bgColorIndex = GetColorIndexForValue(value, aColumnStyle);
      }
      color = 'white';
    }
    // just the value color is set
    if (aColumnStyle.colorMode === ColumnStyleColoring.Value) {
      if (value !== null && !isNaN(value)) {
        color = GetColorForValue(value, aColumnStyle);
        colorIndex = GetColorIndexForValue(value, aColumnStyle);
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
  //console.log(`GetColorForValue: checking value ${value}`);
  for (let i = style.thresholds.length - 1; i > 0; i--) {
    const checkValue = style.thresholds[i].value;
    //console.log(`GetColorForValue: checking value ${value} >= ${checkValue}`);
    if (value >= checkValue) {
      //console.log(`GetColorForValue: value ${value} IS >= ${checkValue} return color index ${i}`);
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
