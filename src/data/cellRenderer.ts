import {
  DateTime,
  dateTime,
  dateTimeForTimeZone,
  DateTimeInput,
  Field,
  FormatInput,
  formattedValueToString,
  getValueFormat,
  GrafanaTheme2,
  isDateTime,
} from "@grafana/data";
import {
  TimeZone,
} from "@grafana/schema";

import _ from 'lodash';
import { DateFormats } from "types";
import { DTColumnType } from "./types";
import moment from 'moment-timezone';

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
  const formattedWithTimezone = moment.tz(
    dateTime(timestamp).utc().toISOString(true),
    timestampFormat, timeZone).format(timestampFormat);
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
export const FormatColumnValue = (field: Field, colIndex: number, rowIndex: number, value: any, valueType: string, timeFrom: string, timeTo: string, theme: GrafanaTheme2): string => {
  //console.log(valueType);
  // the valueFormatter for "time" expects a string already formatted
  // this needs to check if the value is an epoch, and convert that...

  // if is an epoch and type time (numeric string and len > 12)
  if ((valueType === 'time') && !isNaN(value as any)) {
    const parsed = parseInt(value, 10);
    // TODO: fix this
    // May need to adjust for local time zone here
    const fo = TimeFormatter('utc', parsed, DateFormats[5].value);
    return fo;
  }

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
export const ProcessMacroForClickthrough = (columns: any, rows: any, rowIndex: any, value: any, valueType: string, maxDecimals: number) => {
  const aFormatter = getValueFormat(valueType);
  let fixme = value.mean;
  fixme = `$__cell_3`;
  const aRegex = RegExp(/\$__cell_\d+/);
  // @ts-ignore
  let formatted = aFormatter(fixme, maxDecimals).text;
  if (fixme.match(aRegex)) {
    for (let i = columns.length - 1; i >= 0; i--) {
      const cellContent = rows[rowIndex].mean;
      console.log(cellContent);
      fixme = fixme.replace(`$__cell_${i}`, rows[rowIndex].mean);
    }
  }
  return fixme;
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
