import {
  dateTime,
  Field,
  getValueFormat,
  GrafanaTheme2,
  InterpolateFunction,
  stringToJsRegex,
  textUtil,
  TimeRange,
} from "@grafana/data";

import _ from 'lodash';
import { DateFormats } from "types";
import { FormattedColumnValue } from 'types';
import moment from 'moment-timezone';
import { ColumnStyleItemType, ColumnStyles } from "components/options/columnstyles/types";

// Fallback base for `new URL(input, base)` when parsing path-relative
// clickthrough inputs. Dashboards always run in a browser, so
// `window.location.origin` is the real value; the literal is a one-shot
// sentinel for non-browser execution (SSR, jest without jsdom).
const DEFAULT_URL_BASE = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';

// Similar to DataLinks, this replaces the value of the panel time ranges for use in url params
export const ReplaceTimeMacros = (timeRange: TimeRange, content: string) => {
  let newContent = content;
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
  // When timezone is 'browser', resolve to the concrete IANA zone name so
  // moment-timezone can look it up.
  const useTimezone = timeZone === 'browser'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : timeZone;
  // `moment.tz(ms, tz)` takes a UTC milliseconds timestamp and returns a
  // Moment expressed in the target zone — the correct conversion overload. The
  // previous code used `moment.tz(iso, format, tz)`, which is the parsing
  // overload that treats the string input as already-local-to-tz, so no
  // UTC→tz conversion happened and non-UTC zones returned UTC digits.
  const formattedWithTimezone = moment.tz(timestamp, useTimezone).format(timestampFormat);
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
  theme: GrafanaTheme2): FormattedColumnValue => {

  if ((valueType === 'time') && !isNaN(value as any)) {
    const parsed = parseInt(value, 10);
    let dateFormat = DateFormats[5].value;
    if (columnStyle && columnStyle.activeStyle === ColumnStyles.DATE && columnStyle.dateStyle.dateFormat) {
      dateFormat = columnStyle.dateStyle.dateFormat;
    }
    // timezone comes from user preferences
    const formatted = TimeFormatter(userTimeZone, parsed, dateFormat);
    return formatted;
  }

  // encode the object into a readable string
  if (valueType === 'other') {
    const formatted: FormattedColumnValue = {
      valueRaw: value,
      valueFormatted: JSON.stringify(value),
      valueRounded: null,
      valueRoundedAndFormatted: null,
    }
    return formatted;
  }
  // a string value is just copied
  if (valueType === 'string') {
    let formatted: FormattedColumnValue = {
      valueRaw: value,
      valueFormatted: value,
      valueRounded: null,
      valueRoundedAndFormatted: null,
    }
    // might be useful to do the mappings here vs on conversion from dataframes
    //formatted = ApplyMappings(formatted, null);
    return formatted;
  }
  // numbers are formatted here
  let useUnit = 'short';
  if (field.config.unit) {
    useUnit = field.config.unit;
  }
  if (columnStyle && columnStyle.metricStyle.unitFormat) {
    useUnit = columnStyle.metricStyle.unitFormat;
  }

  let maxDecimals = 4;
  if (field.config.decimals !== undefined && field.config.decimals !== null) {
    maxDecimals = field.config.decimals;
  }
  if (columnStyle && columnStyle.metricStyle.decimals) {
    maxDecimals = Number(columnStyle.metricStyle.decimals).valueOf();
  }

  const formatted = applyFormat(value, maxDecimals, useUnit)
  return formatted;
};


export const ProcessClickthrough = (
  columnStyle: ColumnStyleItemType | null,
  columns: any,
  rows: any,
  rowIndex: number,
  processedItem: FormattedColumnValue,
  timeRange: TimeRange,
  replaceVariables: InterpolateFunction) => {

  if (columnStyle?.stringStyle.clickThrough) {
    let clickThrough = ReplaceTimeMacros(timeRange, columnStyle.stringStyle.clickThrough);
    if (columnStyle.stringStyle.splitByPattern) {
      clickThrough = ReplaceCellSplitByPattern(clickThrough, processedItem, columnStyle.stringStyle.splitByPattern)
    }
    clickThrough = ReplaceCellMacros(clickThrough, processedItem.valueFormatted, rows);
    // Resolve Grafana dashboard template variables. Runs AFTER plugin
    // macros so built-ins like $__cell, $__cell_N, $__pattern_N,
    // $__from, $__to, $__keepTime keep precedence. Guarded on the
    // presence of a `$` or `[` so clean URLs short-circuit the call.
    if (/[$\[]/.test(clickThrough)) {
      clickThrough = replaceVariables(clickThrough);
    }
    //
    const target = resolveClickThroughTarget(
      columnStyle.stringStyle.clickThroughOpenNewTab,
      columnStyle.stringStyle.clickThroughCustomTargetEnabled,
      columnStyle.stringStyle.clickThroughCustomTarget,
    );
    if (columnStyle.stringStyle.clickThroughSanitize) {
      clickThrough = textUtil.sanitizeUrl(clickThrough);
    }
    // rebuild with encoding of parameters
    // - HTTP/HTTPS absolute URLs: parse + rebuild to keep host:port and
    //   re-encode the query string against macro-injected content.
    // - Path-relative URLs (leading `/`): parse with window.location.origin
    //   as base so `new URL()` can read pathname/searchParams/hash, then
    //   emit just the path portion so the href stays relative.
    // - Non-HTTP schemes (ftp:, mailto:, etc.) and protocol-relative
    //   (`//host/path`) inputs: emit verbatim. Macro expansion has already
    //   run; no re-encoding is safe without knowing the scheme's rules.
    const isHttp = /^https?:\/\//i.test(clickThrough);
    const isPathRelative = clickThrough.startsWith('/') && !clickThrough.startsWith('//');

    let href: string;
    if (isHttp || isPathRelative) {
      // Absolute HTTP URLs ignore the second arg; only the path-relative
      // branch actually consults it, so skip the origin read on the hot path.
      const url = new URL(clickThrough, isHttp ? undefined : DEFAULT_URL_BASE);
      const origin = isHttp ? `${url.protocol}//${url.host}` : '';
      const query = url.searchParams.toString();
      const queryString = query ? `?${query}` : '';
      href = `${origin}${url.pathname}${queryString}${url.hash}`;
    } else {
      // Verbatim path: no URL-API round-trip, no scheme inference,
      // no protocol-relative auto-promotion to the current origin.
      href = clickThrough;
    }
    const newCell = '<a href="' + href + `" target="${target}">` + processedItem.valueFormatted + '</a>';

    return newCell;
  }
  return null;
}

export const resolveClickThroughTarget = (
  clickThroughOpenNewTab: boolean,
  clickThroughCustomTargetEnabled: boolean,
  clickThroughCustomTarget: string,
): string => {
    let clickThroughTarget = '_self';
    if (clickThroughOpenNewTab) {
      clickThroughTarget = '_blank';
    }
    if (clickThroughCustomTargetEnabled) {
      clickThroughTarget = clickThroughCustomTarget;
    }
    return clickThroughTarget;
  };


// check for $__pattern_N using split-by
export const ReplaceCellSplitByPattern = (
  clickThrough: string,
  cellContent: FormattedColumnValue,
  splitByPattern: string
) => {
  let formatted = clickThrough;
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
): string => {

  let formatted = clickThrough;
  //
  // Replace $__cell with this cell's content $__cell word boundary
  //
  formatted = formatted.replace(/\$__cell\b/, cellContent);

  //
  // process $__cell_N
  //
  const cellNRegex = RegExp(/\$__cell_(\d+)/);
  const matches = clickThrough.match(cellNRegex);
  if (matches) {
    for (let matchIndex = 1; matchIndex < matches.length; matchIndex++) {
      const matchedCellNumber = parseInt(matches[matchIndex], 10);
      if (matchedCellNumber > rows.length) {
        //console.log(`ReplaceCellMacros: referenced cell ${matchedCellNumber} out of bounds`);
        continue;
      }
      const aRow = rows[matchedCellNumber];
      const matchedCellContent = aRow.valueFormatted;
      formatted = formatted.replace(`$__cell_${matchedCellNumber}`, matchedCellContent);
    }
  }
  return formatted;
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
