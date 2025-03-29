// FieldType across runtimes are not working
import {
  DataFrame,
  Field,
  FieldType,
  GrafanaTheme2
} from '@grafana/data';
import { FormatColumnValue } from 'data/cellFormatter';
import { ApplyGrafanaOverrides } from './overrides';
import { ConfigColumnDefs } from 'datatables.net';
import _ from 'lodash';
import {
  ColumnStyleColoring,
  TransformationOptions,
  AggregationType,
} from 'types';
import { DTColumnType } from './types';
import { ColumnStyleItemType } from 'components/options/columnstyles/types';
import { ApplyColumnStyles } from './columnStyles';

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
  // already calculated
  // let globalOperator = 'last';
  // for (const valueField of valueFields) {
  //   const valueFieldName = getFieldDisplayName(valueField!, frame);
  //   const standardCalcs = reduceField({ field: valueField!, reducers: ['bogus'] });
  //   //const operatorValue = GetValueByOperator(valueFieldName, null, globalOperator, standardCalcs);
  //   const operatorValue = GetValueByOperator(valueFieldName, globalOperator, standardCalcs);

  //   let maxDecimals = 4;
  //   if (valueField!.config.decimals !== undefined && valueField!.config.decimals !== null) {
  //     maxDecimals = valueField!.config.decimals;
  //   }
  //   const valueFormat = getValueFormat(valueField!.config.unit)(operatorValue, maxDecimals, undefined, undefined);
  //   const valueFormatted = formattedValueToString(valueFormat);
  //   console.log(`valueFieldName: ${valueFieldName}`);
  //   console.log(`standardCalcs: ` + JSON.stringify(standardCalcs));
  //   console.log(`operatorValue: ${operatorValue}`);
  //   console.log(`valueFormat: ` + JSON.stringify(valueFormat));
  //   console.log(`valueFormatted: ${valueFormatted}`);
  //   // eslint-disable-next-line no-debugger
  //   debugger;
  // }
};


export function ConvertDataFrameToDataTableFormat<T>(
  alignNumbersToRightEnabled: boolean,
  rowNumbersEnabled: boolean,
  tableTransforms: TransformationOptions,
  aggregations: AggregationType[],
  dataFrames: DataFrame[],
  columnStyles: ColumnStyleItemType[],
  theme: GrafanaTheme2): { columns: DTColumnType[]; rows: T[] } {
  DataFrameToDisplay(dataFrames);
  ApplyGrafanaOverrides(dataFrames, theme);
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
  const rows = [] as T[];

  for (let i = 0; i < dataFrame.length; i++) {
    const row = {};
    for (let j = 0; j < columns.length; j++) {
      const value = dataFrame.fields[j].values[i];
      const valueType = dataFrame.fields[j].type;
      const fieldConfig = dataFrame.fields[j].config;
      let formattedValue = value;
      if (valueType !== 'string') {
        // this needs to be done AFTER all of the rows/columns are collected
        formattedValue = FormatColumnValue(null, fieldConfig, j, i, value, valueType, "timeFrom", "timeTo");
      }
      //@ts-ignore
      row[columns[j].data] = formattedValue;
    }
    rows.push(row as T);
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
  columns = ApplyColumnStyles(columns, columnStyles);
  return { columns, rows };
}

export const buildColumnDefs = (
  emptyDataEnabled: boolean,
  emptyDataText: string,
  rowNumbersEnabled: boolean,
  fontSizePercent: string,
  alignNumbersToRightEnabled: boolean,
  dtColumns: DTColumnType[],
  flattenedRows: any[]): ConfigColumnDefs[] => {

  const columnDefs: ConfigColumnDefs[] = [];
  let rowNumberOffset = 0;
  for (let i = 0; i < dtColumns.length; i++) {
    let columnType = dtColumns[i].type!;
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
    if (columnType !== undefined && flattenedRows[0] && (typeof flattenedRows[0][i]) === 'number') {
      columnType = 'number';
    }

    dtColumns[i].className = columnClassName;
    // NOTE: the width below is a "hint" and will be overridden as needed, this lets most tables show timestamps
    // with full width
    // NOTE the className here no longer appears to work, setting it later
    // can we get the columnStyle here? merge rawColumn Data?
    // eslint-disable-next-line no-debugger
    //debugger;
    // columns.push({
    //   title: columnAlias,
    //   type: columnType,
    //   widthHint: columnWidthHint,
    //   className: columnClassName,
    //   data: '',
    //   fieldConfig: {},
    //   columnStyle: null
    // });
    let columnDefDict: any = {
      width: dtColumns[i].widthHint,
      targets: i + rowNumberOffset,
      defaultContent: emptyDataEnabled ? emptyDataText : '',
      data: function (row: any, type: any, set: any, meta: any) {
        if (type === undefined) {
          return null;
        }
        const idx = meta.col;
        // use display type for return
        // TODO; display has not been set yet
        //let returnValue = row[idx].display;
        if (row[idx]?.display !== undefined) {
          return row[idx].display;
        }
        return null;
      },
      render: function (data: any, type: any, val: any, meta: any) {
        if (type === undefined) {
          return null;
        }
        const idx = meta.col;
        if (type === 'type') {
          return val[idx];
        }
        // use display type for return
        // TODO: this should be set to the formatted value, for now just return raw value
        // eslint-disable-next-line no-debugger
        //debugger;
        //console.log(rows[idx]);
        //console.log(meta);
        //let returnValue = rows[meta.row][idx]; // val[idx].display;
        let returnValue = val[meta.col];
        return returnValue;
      },
      createdCell: (cell: any, cellDataAlwaysEmpty: any, rowData: any, rowIndex: any, colIndex: any) => {
        // set the fontsize for the cell
        // cellData is empty since we use render()
        const aColumn = dtColumns[colIndex];
        $(cell).css('font-size', fontSizePercent);
        // orthogonal sort requires getting cell data differently
        const cellContent = $(cell).html();
        //console.log(cellContent);
        // hidden columns have null data
        if (cellContent === null) {
          return;
        }
        // can only evaluate thresholds on a numerical value
        if (isNaN(Number(cellContent))) {
          //console.log(`createdCell: ${cellContent} is not a number...`);
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
        let colorMode = aColumn.columnStyle?.colorMode;
        if (colorMode === ColumnStyleColoring.Row) {
          // run all of the rowData through threshold check, get the "highest" index
          // and use that for the entire row
          if (rowData === null) {
            return;
          }
          rowColorIndex = -1;
          rowColorData = null;
          rowColor = 'teal';
          // this should be configurable...
          color = 'white';
          for (let columnNumber = 0; columnNumber < dtColumns.length; columnNumber++) {
            let x = dtColumns[columnNumber].columnStyle;
            // need the style to get the color
            if (!x) {
              //console.log(`no style found for column ${columnNumber}`);
              continue;
            }
            rowColorData = getCellColors(
              x,
              columnNumber,
              rowData[columnNumber + rowNumberOffset]
            );
            if (!rowColorData) {
              continue;
            }

            if (rowColorData.bgColorIndex !== null) {
              //console.log(`testing rowColorIndex = ${rowColorIndex}`);
              //console.log(`testing rowColorData.bgColorIndex = ${rowColorData.bgColorIndex}`);
              //console.log(`testing rowColorData.bgColor = ${rowColorData.bgColorIndex}`);
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
          for (let columnNumber = 0; columnNumber < dtColumns.length; columnNumber++) {
            if (dtColumns[columnNumber].type === undefined) {
              //let x = dtColumns[columnNumber].columnStyle;
              //console.log(x);
              if (dtColumns[columnNumber].columnStyle!) {
                rowColorData = getCellColors(
                  dtColumns[columnNumber].columnStyle!,
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
          if (dtColumns[0].type !== undefined) {
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
  //console.log(`getCellColors: cellData = ${cellData}`);
  if (aColumnStyle === null || cellData === null || cellData === undefined) {
    return null;
  }
  const items = cellData.split(/([^0-9.,]+)/);
  // only color cell if the content is a number?
  let bgColor = null;
  let bgColorIndex = null;
  let color = null;
  let colorIndex = null;
  //let colStyle = null;
  let value = null;
  // check if the content has a numeric value after the split
  if (!isNaN(Number(items[0]))) {
    // run value through threshold function
    //console.log(`parsing ${items[0]}`);
    value = parseFloat(items[0].replace(',', '.'));
    //const styles: any[] = [];
    //colStyle = aColumnStyle; // getStyleForColumn(columnNumber, cellData, styles);
  }

  if (aColumnStyle && aColumnStyle.colorMode != null && aColumnStyle.thresholds.length > 0) {
    // check color for either cell or row
    if (aColumnStyle.colorMode === ColumnStyleColoring.Cell ||
      aColumnStyle.colorMode === ColumnStyleColoring.Row ||
      aColumnStyle.colorMode === ColumnStyleColoring.RowColumn) {
      // bgColor = _this.colorState.cell;
      if (value !== null && !isNaN(value)) {
        bgColor = GetColorForValue(value, aColumnStyle);
        bgColorIndex = GetColorIndexForValue(value, aColumnStyle);
      } else {
        console.log(`skipped... ${value}`);
      }
      color = 'white';
    }
    // just the value color is set
    if (aColumnStyle.colorMode === ColumnStyleColoring.Value) {
      //color = _this.colorState.value;
      if (value !== null && !isNaN(value)) {
        color = GetColorForValue(value, aColumnStyle);
        colorIndex = GetColorIndexForValue(value, aColumnStyle);
      } else {
        console.log(`skipped... ${value}`);
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

// const getStyleForColumn = (columnNumber: any, rawColumns: any, styles: any) => {
//   let colStyle = null;
//   for (let i = 0; i < styles.length; i++) {
//     const style = styles[i];
//     const column = rawColumns[columnNumber];
//     if (column === undefined) {
//       break;
//     }
//     const regex = stringToJsRegex(style.pattern);
//     if (column.text.match(regex)) {
//       colStyle = style;
//       break;
//     }
//   }
//   return colStyle;
// };

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
