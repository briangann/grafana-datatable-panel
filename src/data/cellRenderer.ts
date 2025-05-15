import {
  dateTime,
  Field,
  formattedValueToString,
  getValueFormat,
  GrafanaTheme2,
  stringToJsRegex,
  TimeRange,
} from "@grafana/data";

import _ from 'lodash';
import { DateFormats } from "types";
import { DTColumnType, FormattedColumnValue } from "./types";
import moment from 'moment-timezone';
import { ColumnStyleItemType } from "components/options/columnstyles/types";

// Similar to DataLinks, this replaces the value of the panel time ranges for use in url params
export const ReplaceTimeMacros = (timeRange: TimeRange, content: string) => {
  let newContent = content;
  // eslint-disable-next-line no-debugger
  debugger;
  if (content.match(/\$__from/g)) {
    newContent = newContent.replace('$__from', timeRange.raw.from.toString());
  }
  if (content.match(/\$__to/g)) {
    newContent = newContent.replace('$__to', timeRange.raw.to.toString());
  }
  if (content.match(/\$__keepTime/g)) {
    newContent = newContent.replace(`$__keepTime`, `from=${timeRange.raw.from}&to=${timeRange.raw.to}`);
  }
  return newContent;
};

/**
 * [TimeFormatter description]
 *
 * @param   {string}  timeZone         [timeZone description]
 * @param   {number}  timestamp        [timestamp description]
 * @param   {string}  timestampFormat  [timestampFormat description]
 *
 * @return  {string}                   [return description]
 */
export const TimeFormatter = (timeZone: string, timestamp: number, timestampFormat: string): FormattedColumnValue => {
  if (timeZone === 'utc') {
    const timestampFormatted = dateTime(timestamp)
      .utc()
      .format(timestampFormat);
    const formatted: FormattedColumnValue = {
      valueRaw: timestamp,
      valueFormatted: timestampFormatted,
      valueRounded: null,
      valueRoundedAndFormatted: timestampFormatted,
    }
    return formatted;
  }
  // this appears to be bugged
  //
  // const timestampFormatted = dateTimeForTimeZone(timeZone, timestamp);
  // console.log(timestampFormatted.toISOString(true));

  // TODO: bug
  // when timezone is browser, moment.tz can't be used
  //
  let formattedWithTimezone = dateTime(timestamp).format(timestampFormat);
  if (timeZone !== 'browser') {
    formattedWithTimezone = moment.tz(
      dateTime(timestamp).utc().toISOString(true),
      timestampFormat, timeZone).format(timestampFormat);
  }
      const formatted: FormattedColumnValue = {
      valueRaw: timestamp,
      valueFormatted: formattedWithTimezone,
      valueRounded: null,
      valueRoundedAndFormatted: formattedWithTimezone,
    }

  return formatted;
}

/**
 * [FormatColumnValue description]
 *
 * @param   {Field}          field      [field description]
 * @param   {number}         colIndex   [colIndex description]
 * @param   {number}         rowIndex   [rowIndex description]
 * @param   {any}            value      [value description]
 * @param   {string}         valueType  [valueType description]
 * @param   {string}         timeFrom   [timeFrom description]
 * @param   {string}         timeTo     [timeTo description]
 * @param   {GrafanaTheme2}  theme      [theme description]
 *
 * @return  {string}                    [Formatted Value]
 */
export const FormatColumnValue = (
  userTimeZone: string,
  columnStyle: ColumnStyleItemType | null,
  field: Field,
  colIndex: number,
  rowIndex: number,
  value: any,
  valueType: string,
  timeFrom: string,
  timeTo: string,
  theme: GrafanaTheme2): FormattedColumnValue => {
  // if is an epoch and type time (numeric string and len > 12)
  if ((valueType === 'time') && !isNaN(value as any)) {
    const parsed = parseInt(value, 10);
    let dateFormat = DateFormats[5].value;
    if (columnStyle && columnStyle.dateFormat) {
      dateFormat = columnStyle.dateFormat;
    }
    // timezone comes from user preferences
    const formatted = TimeFormatter(userTimeZone, parsed, dateFormat);
    return formatted;
  }

  if (valueType === 'other') {
    const formatted: FormattedColumnValue = {
      valueRaw: value,
      valueFormatted: JSON.stringify(value),
      valueRounded: null,
      valueRoundedAndFormatted: null,
    }
    return formatted;
  }
  const aFormatter = getValueFormat(field.config.unit);

  let maxDecimals = 4;
  if (field.config.decimals !== undefined && field.config.decimals !== null) {
    maxDecimals = field.config.decimals;
  }

  let formattedToString = formattedValueToString(aFormatter(value, maxDecimals));
      const formatted: FormattedColumnValue = {
      valueRaw: value,
      valueFormatted: formattedToString,
      valueRounded: null,
      valueRoundedAndFormatted: null,
    }

  return formatted;
};

// TODO: this is not complete
// sanitize / url construction is done after this
export const ProcessClickthrough = (
  columnStyle: ColumnStyleItemType | null,
  columns: any,
  rows: any,
  rowIndex: number,
  value: any,
  timeRange: TimeRange) => {

  // eslint-disable-next-line no-debugger
  debugger;
  if (columnStyle?.clickThrough) {
    let clickThrough = ReplaceTimeMacros(timeRange, columnStyle.clickThrough);
    // cell content is used in the split-by pattern option 
    const cellContent = rows[rowIndex];
    if (columnStyle.splitByPattern) {
      clickThrough = ReplaceCellSplitByPattern(clickThrough, cellContent, columnStyle.splitByPattern)
    }
    clickThrough = ReplaceCellMacros(clickThrough, value, columns, rows);
    // TODO: allowing template variables would be a great addition
    return clickThrough;
  }
  return null;
}

// check for $__pattern_N using split-by
export const ReplaceCellSplitByPattern = (
  clickThrough: string,
  cellContent: FormattedColumnValue,
  splitByPattern: string
) => {
  let formatted = clickThrough;
  // eslint-disable-next-line no-debugger
  debugger;
  if (!cellContent || cellContent.valueFormatted.length === 0) {
    return formatted;
  }
  // Replace patterns
  const splitByPatternRegex = stringToJsRegex(splitByPattern);
  const values = cellContent.valueFormatted.split(splitByPatternRegex);
  values.map((val: any, i: any) => (formatted = formatted.replace(`$__pattern_${i}`, val)));

  return formatted;
}
export const ReplaceCellMacros = (
  clickThrough: string,
  cellContent: string,
  rows: any,
  rowIndex: number,
): string => {

  let formatted = clickThrough;
  //
  // Replace $__cell with this cell's content $__cell word boundary
  //
  formatted = formatted.replace(/\$__cell\b/, cellContent);

  //
  // process $__cell_N
  //
  const cellNRegex = RegExp(/\$__cell_\d+/g);
  const matches = clickThrough.match(cellNRegex);
  if (matches) {
    for (let matchIndex = 1; matchIndex < matches.length; matchIndex++) {
      //console.log(`rowIndex: ${rowIndex} matchIndex: ${matchIndex}`);
      const matchedCellNumber = parseInt(matches[matchIndex], 10);
      if (!isNaN(matchedCellNumber)) {
        const matchedCellContent = rows[rowIndex][matchedCellNumber];
        //console.log(`matchedCellNumber: ${matchedCellNumber} matchedCellContent: ${matchedCellContent}`);
        formatted = formatted.replace(`$__cell_${matchedCellNumber}`, matchedCellContent);
      }
    }
  }
  return formatted;
}

export const ApplyUnitsAndDecimals = (columns: DTColumnType[], rows: any[]) => {
  for (const item of columns) {
    const aStyle = item.columnStyle;
    if (aStyle) {
      let decimals = Number(item.columnStyle?.decimals).valueOf();
      let unit = aStyle?.unitFormat || 'short';
      let colName = item.data;
      for (const aRow of rows) {
        let value = aRow[colName];
        const formatted = applyFormat(value, decimals, unit)
        aRow[colName] = formatted;
      }
    }
  }
  return { columns, rows };
}

export const applyFormat = (value: any, maxDecimals: number, unitFormat: string) => {
  let valueFormatted = '';
  let valueRounded = NaN;
  let valueRoundedAndFormatted = '';
  const formatFunc = getValueFormat(unitFormat);
  if (formatFunc) {
    const decimals: number = maxDecimals;
    const formatted = formatFunc(value, decimals);

    valueFormatted = formatted.text;
    valueRoundedAndFormatted = roundValue(value, decimals) || value;
    valueRounded = roundValue(value, decimals) || value;
    // spaces are included with the formatFunc
    if (formatted.suffix) {
      valueFormatted += formatted.suffix;
      valueRoundedAndFormatted += formatted.suffix;
    }
    if (formatted.prefix) {
      valueFormatted = formatted.prefix + valueFormatted;
      valueRoundedAndFormatted = formatted.prefix + valueRoundedAndFormatted;
    }
  }
  const result: FormattedColumnValue = {
      valueRaw: value,
      valueFormatted: valueFormatted,
      valueRounded: valueRounded,
      valueRoundedAndFormatted: valueRoundedAndFormatted,
    };
  return result;
}

const roundValue = (num: number, decimals: number): number | null => {
  if (num === null) {
    return null;
  }
  const n = Math.pow(10, decimals);
  const formatted = (n * num).toFixed(decimals);
  return Math.round(parseFloat(formatted)) / n;
};
