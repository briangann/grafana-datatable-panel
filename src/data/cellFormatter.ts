import {
  dateTime,
  FieldConfig,
  getValueFormat,
} from "@grafana/data";
import _ from 'lodash';
import { DateFormats } from "types";


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

export const TimeFormatter = (timeZone: string, timestamp: number, timestampFormat: string): string => {
  const timestampFormatted =
    timeZone === 'utc'
      ? dateTime(timestamp)
        .utc()
        .format(timestampFormat)
      : dateTime(timestamp).format(timestampFormat);
  return timestampFormatted;
}


/**
 * [formatColumnValue description]
 * @param  {[type]} colIndex [description]
 * @param  {[type]} rowIndex [description]
 * @param  {[type]} value    [description]
 * @return {[type]}          [description]
 */
export const FormatColumnValue = (data: any, fieldConfig: FieldConfig, colIndex: any, rowIndex: any, value: any, valueType: string, timeFrom: string, timeTo: string) => {
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
  const aFormatter = getValueFormat(valueType);

  let maxDecimals = 4;
  if (fieldConfig.decimals !== undefined && fieldConfig.decimals !== null) {
      maxDecimals = fieldConfig.decimals;
  }

  let formatted = aFormatter(value, maxDecimals).text;
  return formatted;
};

export const ProcessMacroForClickthrough = (columns: any, rows: any, rowIndex: any, value: any, valueType: string, maxDecimals: number) => {
  // eslint-disable-next-line no-debugger
  debugger;
  const aFormatter = getValueFormat(valueType);
  let foo = value.mean;
  foo = `$__cell_3`;
  const aRegex = RegExp(/\$__cell_\d+/);
  // @ts-ignore
  let formatted = aFormatter(foo, maxDecimals).text;
  if (foo.match(aRegex)) {
    // eslint-disable-next-line no-debugger
    //debugger;
    for (let i = columns.length - 1; i >= 0; i--) {
      const cellContent = rows[rowIndex].mean;
      console.log(cellContent);
      foo = foo.replace(`$__cell_${i}`, rows[rowIndex].mean);
    }
  }
  return foo;
}
