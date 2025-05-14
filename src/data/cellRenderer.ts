import {
  dateTime,
  Field,
  formattedValueToString,
  getValueFormat,
  GrafanaTheme2,
  TimeRange,
} from "@grafana/data";

import _ from 'lodash';
import { DateFormats } from "types";
import { DTColumnType } from "./types";
import moment from 'moment-timezone';
import { ColumnStyleItemType } from "components/options/columnstyles/types";

// Similar to DataLinks, this replaces the value of the panel time ranges for use in url params
export const ReplaceTimeMacros = (timeFrom: string, timeTo: string, content: string) => {
  let newContent = content;
  if (content.match(/\$__from/g)) {
    // replace all occurrences
    newContent = newContent.replace('$__from', timeFrom);
  }
  if (content.match(/\$__to/g)) {
    // replace all occurrences
    newContent = newContent.replace('$__to', timeTo);
  }
  if (content.match(/\$__keepTime/g)) {
    // replace all occurrences
    const keepTime = `from=${timeFrom}&to=${timeTo}`;
    newContent = newContent.replace('$__keepTime', keepTime);
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
export const TimeFormatter = (timeZone: string, timestamp: number, timestampFormat: string): string => {
  if (timeZone === 'utc') {
    const timestampFormatted = dateTime(timestamp)
    .utc()
    .format(timestampFormat);
    return timestampFormatted;
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
  return formattedWithTimezone;
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
export const FormatColumnValue = (userTimeZone: string, columnStyle: ColumnStyleItemType|null, field: Field, colIndex: number, rowIndex: number, value: any, valueType: string, timeFrom: string, timeTo: string, theme: GrafanaTheme2): string => {
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

  // value type String

  if (valueType === 'other') {
    return JSON.stringify(value);
  }
  const aFormatter = getValueFormat(field.config.unit);

  let maxDecimals = 4;
  if (field.config.decimals !== undefined && field.config.decimals !== null) {
      maxDecimals = field.config.decimals;
  }

  let formatted = formattedValueToString(aFormatter(value, maxDecimals));
  return formatted;
};

// TODO: this is not complete
export const ProcessMacrosForClickthrough = (
  columnStyle: ColumnStyleItemType|null,
  columns: any,
  rows: any,
  colIndex: number,
  rowIndex: number,
  value: any,
  valueType: string,
  timeRange: TimeRange) => {
  // check for $__keepTime
  // eslint-disable-next-line no-debugger
  debugger;
  if (!columnStyle?.clickThrough) {
    return null;
  }
  const keepTimeRegex = RegExp(/\$__keepTime/);
  let clickThrough = columnStyle?.clickThrough;
  if (clickThrough.match(keepTimeRegex)) {
    clickThrough = clickThrough.replace(`$__keepTime`, `from=${timeRange.raw.from}&to=${timeRange.raw.to}`);
  }
  const aRegex = RegExp(/\$__cell_\d+/);
  if (clickThrough.match(aRegex)) {
    for (let i = columns.length - 1; i >= 0; i--) {
      // this is text content, whatever is in the row should be formatted
      // eslint-disable-next-line no-debugger
      debugger;
      const cellContent = rows[rowIndex].mean;
      console.log(cellContent);
      clickThrough = clickThrough.replace(`$__cell_${i}`, rows[rowIndex].mean);
    }
  }
  return clickThrough;
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
  return {columns, rows};
}

export const applyFormat = (value: any, maxDecimals: number, unitFormat: string) => {
  let valueFormatted = '';
  let valueRounded = '';
  let valueRoundedAndFormatted = '';
  const formatFunc = getValueFormat(unitFormat);
  if (formatFunc) {
    const decimals: number = maxDecimals;
    const formatted = formatFunc(value, decimals);

    valueFormatted = formatted.text;
    valueRoundedAndFormatted = roundValue(value, decimals) || value;
    valueRounded= roundValue(value, decimals) || value;
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
  return (
    {
      valueRaw: value,
      valueFormatted: valueFormatted,
      valueRounded: valueRounded,
      valueRoundedAndFormatted: valueRoundedAndFormatted,
    }
  )
}

const roundValue = (num: number, decimals: number): number | null => {
  if (num === null) {
    return null;
  }
  const n = Math.pow(10, decimals);
  const formatted = (n * num).toFixed(decimals);
  return Math.round(parseFloat(formatted)) / n;
};
