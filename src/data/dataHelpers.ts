// FieldType across runtimes are not working
import { applyFieldOverrides, DataFrame, Field, FieldCalcs, FieldType, formattedValueToString, getDisplayProcessor, getFieldDisplayName, getValueFormat, GrafanaTheme2, reduceField, stringToJsRegex } from '@grafana/data';
import { FormatColumnValue } from 'data/cellFormatter';
import { ConfigColumns, ConfigColumnDefs } from 'datatables.net';
import _, { isNumber } from 'lodash';
import { ColumnWidthHint } from 'types';


function normalizeFieldName(field: string) {
  return field
    .replace(/ /g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();
}

const GetValueByOperator = (
  metricName: string,
  operatorName: string,
  calcs: FieldCalcs
) => {
  switch (operatorName) {
    case 'name':
      return metricName;
    case 'last_time':
      // if (data) {
      //   return data.timestamp;
      // } else {
        return Date.now();
      //}
    default:
      let aValue = calcs[operatorName];
      return aValue;
  }
};

// WIP
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
  let globalOperator = 'last';
  for (const valueField of valueFields) {
    const valueFieldName = getFieldDisplayName(valueField!, frame);
    const standardCalcs = reduceField({ field: valueField!, reducers: ['bogus'] });
    //const operatorValue = GetValueByOperator(valueFieldName, null, globalOperator, standardCalcs);
    const operatorValue = GetValueByOperator(valueFieldName, globalOperator, standardCalcs);

    let maxDecimals = 4;
    if (valueField!.config.decimals !== undefined && valueField!.config.decimals !== null) {
      maxDecimals = valueField!.config.decimals;
    }
    const valueFormat = getValueFormat(valueField!.config.unit)(operatorValue, maxDecimals, undefined, undefined);
    const valueFormatted = formattedValueToString(valueFormat);
    console.log(`valueFieldName: ${valueFieldName}`);
    console.log(`standardCalcs: ${standardCalcs}`);
    console.log(`operatorValue: ${operatorValue}`);
    console.log(`valueFormat: ${valueFormat}`);
    console.log(`valueFormatted: ${valueFormatted}`);
  }
};

// WIP
export const ApplyGrafanaOverrides = (dataFrames: DataFrame[], theme: GrafanaTheme2) => {
  if (dataFrames) {
    dataFrames = applyFieldOverrides({
      data: dataFrames,
      fieldConfig: {
        defaults: {},
        overrides: []
      },
      theme,
      replaceVariables: (value: string) => value,
    });
    console.log(dataFrames[0].fields);
    for (let i = 0; i < dataFrames[0].fields.length; i++) {
      const aField = dataFrames[0].fields[i];
      const display = getDisplayProcessor({
        field: aField,
        theme,
      });
      //console.log(display);
      // formatted output of one of the fields
      console.log(`field name ${aField.name}`);
      const fieldValue = aField.values[0];
      const fv = formattedValueToString(display(fieldValue));
      console.log(`fieldName ${aField.name} value ${fv}`);
    }
  }
}

export function dataFrameToDataTableFormat<T>(
  alignNumbersToRightEnabled: boolean,
  rowNumbersEnabled: boolean,
  dataFrames: DataFrame[],
  theme: GrafanaTheme2): { columns: ConfigColumns[]; rows: T[] } {
  DataFrameToDisplay(dataFrames);
  ApplyGrafanaOverrides(dataFrames, theme);
  const dataFrame = dataFrames[0];
  const columns = dataFrame.fields.map((field) => {
  const columnClassName = getColumnClassName(alignNumbersToRightEnabled, field.type as string)
    return {
      title: field.name,
      data: normalizeFieldName(field.name),
      type: field.type as string,
      className: columnClassName,
    };
  });
  const rows = [] as T[];

  for (let i = 0; i < dataFrame.length; i++) {
    const row = { };
    for (let j = 0; j < columns.length; j++) {
      const value = dataFrame.fields[j].values[i];
      const valueType = dataFrame.fields[j].type;
      let formattedValue = value;
      if (valueType !== 'string') {
        formattedValue = FormatColumnValue(null, j, i, value, valueType, "timeFrom", "timeTo");
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
      className: ''
    });
    for (let i = 0; i < dataFrame.length; i++) {
      // @ts-ignore
      rows[i].rowNumber = i;
    }
  }

  return { columns, rows };
}

const getColumnWidthHint = (name: string, columnWidthHints: ColumnWidthHint[]) => {
  for (let i = 0; i < columnWidthHints.length; i++) {
    if (columnWidthHints[0].name === name) {
      return columnWidthHints[0].width;
    }
  }
  return null;
}

export const setColumnWidthHints = (configColumns: ConfigColumns[], columnWidthHints: ColumnWidthHint[]): ConfigColumns[] => {

  for (let i = 0; i < configColumns.length; i++) {
    const aHint = getColumnWidthHint(configColumns[i].title!, columnWidthHints);
    if (aHint) {
      configColumns[i].width = aHint;
    }
  }
  return configColumns;
}

export const buildColumnDefs = (
  emptyDataEnabled: boolean,
  emptyDataText: string,
  rowNumbersEnabled: boolean,
  fontSizePercent: string,
  columnWidthHints: ColumnWidthHint[],
  alignNumbersToRightEnabled: boolean,
  rawColumns: ConfigColumns[], rows: any[]) => {

  const columns: ConfigColumns[] = [];
  const columnDefs: ConfigColumnDefs[] = [];
  let rowNumberOffset = 0;
  for (let i = 0; i < rawColumns.length; i++) {
    const columnAlias = rawColumns[i].title; // this.getColumnAlias(this.table.columns[i].text);
    let columnWidthHint = '';
    let columnType = rawColumns[i].type;
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
    if (!columnType && rows[0] && (typeof rows[0][i]) === 'number' ) {
      columnType = 'number';
    }

    rawColumns[i].className = columnClassName;
    // NOTE: the width below is a "hint" and will be overridden as needed, this lets most tables show timestamps
    // with full width
    // NOTE the className here no longer appears to work, setting it later
    columns.push({
      title: columnAlias,
      type: columnType,
      width: columnWidthHint,
      className: columnClassName,
    });
    let columnDefDict: any = {
      targets: i + rowNumberOffset,
      defaultContent: emptyDataEnabled ? emptyDataText : '',
      data: function(row: any, type: any, set: any, meta: any) {
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
      render: function(data: any, type: any, val: any, meta: any) {
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
        let returnValue = rows[meta.row][idx]; // val[idx].display;
        return returnValue;
      },
      createdCell: (td: any, cellData: any, rowData: any, row: any, col: any) => {
        // set the fontsize for the cell
        $(td).css('font-size', fontSizePercent);
        // orthogonal sort requires getting cell data differently
        const formattedData = $(td).html();
        // can only evaluate thresholds on a numerical value
        // also - hidden columns have null data
        if (!isNumber(cellData)) {
          return;
        }
        if (formattedData === null) {
          return;
        }
        cellData = formattedData;
        // undefined types should have numerical data, any others are already formatted
        let actualColumn = col;
        if (rowNumbersEnabled) {
          actualColumn -= 1;
        }
        // for coloring rows, get the "worst" threshold
        let rowColor = null;
        let color = null;
        let rowColorIndex = null;
        let rowColorData = null;
        const yellowState = 'yellow';
        const redState = 'red';
        const greenState = 'green';
        let colorState = {
          row: yellowState,
          rowcolumn: redState,
          cell: greenState,
          value: '123.45',
        };
        if (colorState.row) {
          // run all of the rowData through threshold check, get the "highest" index
          // and use that for the entire row
          if (rowData === null) {
            return;
          }
          rowColorIndex = -1;
          rowColorData = null;
          rowColor = colorState.row;
          // this should be configurable...
          color = 'white';
          for (let columnNumber = 0; columnNumber < rawColumns.length; columnNumber++) {
            // only columns of type undefined are checked
            if (rawColumns[columnNumber].type === undefined) {
              rowColorData = getCellColors(
                colorState,
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
          }
          // TODO: this is being applied with no styles/thresholds
          console.log(`color = ${rowColor}`);
          // style the entire row (the parent of the td is the tr)
          // this will color the rowNumber and Timestamp also
          $(td.parentNode)
            .children()
            .css('color', color);
          $(td.parentNode)
            .children()
            .css('background-color', rowColor);
        }

        if (colorState.rowcolumn) {
          // run all of the rowData through threshold check, get the "highest" index
          // and use that for the entire row
          if (rowData === null) {
            return;
          }
          rowColorIndex = -1;
          rowColorData = null;
          rowColor = colorState.rowcolumn;
          // this should be configurable...
          color = 'white';
          for (let columnNumber = 0; columnNumber < rawColumns.length; columnNumber++) {
            // only columns of type undefined are checked
            if (rawColumns[columnNumber].type === undefined) {
              rowColorData = getCellColors(
                colorState,
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
          }
          // style the rowNumber and Timestamp column
          // the cell colors will be determined in the next phase
          if (rawColumns[0].type !== undefined) {
            const children = $(td.parentNode).children();
            let aChild = children[0];
            $(aChild).css('color', color);
            $(aChild).css('background-color', rowColor);
            // the 0 column contains the row number, if they are enabled
            // then the above just filled in the color for the row number,
            // now take care of the timestamp
            if (rowNumbersEnabled) {
              aChild = children[1];
              $(aChild).css('color', color);
              $(aChild).css('background-color', rowColor);
            }
          }
        }

        // Process cell coloring
        // Two scenarios:
        //    1) Cell coloring is enabled, the above row color is skipped
        //    2) RowColumn is enabled, the above row color is process, but we also
        //    set the cell colors individually
        const colorData = getCellColors(colorState, actualColumn, cellData);
        if (!colorData) {
          return;
        }
        if (colorState.cell || colorState.rowcolumn) {
          if (colorData && colorData.color !== undefined) {
            $(td).css('color', colorData.color);
          }
          if (colorData && colorData.bgColor !== undefined) {
            $(td).css('background-color', colorData.bgColor);
          }
        } else if (colorState.value) {
          if (colorData && colorData.color !== undefined) {
            $(td).css('color', colorData.color);
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

const getColumnClassName = (alignNumbersToRightEnabled: boolean, aColumn: any) => {
  let columnClassName = '';

  // column type "date" is very limited, and overrides our formatting
  // best to use our format, then the "raw" epoch time as the sort ordering field
  // https://datatables.net/reference/option/columns.type
  let columnType = aColumn.type;
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

const getCellColors = (colorState: any, columnNumber: any, cellData: any) => {
  if (cellData === null || cellData === undefined) {
    return null;
  }
  const items = cellData.split(/([^0-9.,]+)/);
  // only color cell if the content is a number?
  let bgColor = null;
  let bgColorIndex = null;
  let color = null;
  let colorIndex = null;
  let colStyle = null;
  let value = null;
  // check if the content has a numeric value after the split
  if (!isNaN(items[0])) {
    // run value through threshold function
    value = parseFloat(items[0].replace(',', '.'));
    const styles: any[] = [];
    colStyle = getStyleForColumn(columnNumber, cellData, styles);
  }
  if (colStyle !== null && colStyle.colorMode != null) {
    // check color for either cell or row
    if (colorState.cell || colorState.row || colorState.rowcolumn) {
      // bgColor = _this.colorState.cell;
      bgColor = GetColorForValue(value, colStyle);
      bgColorIndex = GetColorIndexForValue(value, colStyle);
      color = 'white';
    }
    // just the value color is set
    if (colorState.value) {
      //color = _this.colorState.value;
      color = GetColorForValue(value, colStyle);
      colorIndex = GetColorIndexForValue(value, colStyle);
    }
  }
  return {
    bgColor: bgColor,
    bgColorIndex: bgColorIndex,
    color: color,
    colorIndex: colorIndex,
  };
};

const getStyleForColumn = (columnNumber: any, rawColumns: any, styles: any) => {
  let colStyle = null;
  for (let i = 0; i < styles.length; i++) {
    const style = styles[i];
    const column = rawColumns[columnNumber];
    if (column === undefined) {
      break;
    }
    const regex = stringToJsRegex(style.pattern);
    if (column.text.match(regex)) {
      colStyle = style;
      break;
    }
  }
  return colStyle;
};

export const GetColorForValue = (value: any, style: any) => {
  if (!style.thresholds) {
    return null;
  }
  for (let i = style.thresholds.length; i > 0; i--) {
    if (value >= style.thresholds[i - 1]) {
      return style.colors[i];
    }
  }
  return _.first(style.colors);
};

// to determine the overall row color, the index of the threshold is needed
export const GetColorIndexForValue = (value: any, style: any) => {
  if (!style.thresholds) {
    return null;
  }
  for (let i = style.thresholds.length; i > 0; i--) {
    if (value >= style.thresholds[i - 1]) {
      return i;
    }
  }
  return 0;
};

/*
// taken from @grafana/data
function StringToJsRegex(str: string): RegExp {
  if (str[0] !== '/') {
    return new RegExp('^' + str + '$');
  }
  const match = str.match(new RegExp('^/(.*?)/(g?i?m?y?)$'));
  if (!match) {
    throw new Error(`'${str}' is not a valid regular expression.`);
  }
  return new RegExp(match[1], match[2]);
}
  */
