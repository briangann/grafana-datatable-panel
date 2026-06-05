import {
  dateTime,
  Field,
  getValueFormat,
  InterpolateFunction,
  stringToJsRegex,
  textUtil,
  TimeRange,
} from "@grafana/data";

import _ from 'lodash';
import { ColumnStyleItemType, ColumnStyles, DateFormats, FormattedColumnValue } from "types";
import moment from 'moment-timezone';

// Fallback base for `new URL(input, base)` when parsing path-relative
// clickthrough inputs. Dashboards always run in a browser, so
// `window.location.origin` is the real value; the literal is a one-shot
// sentinel for non-browser execution (SSR, jest without jsdom).
const DEFAULT_URL_BASE = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';

// The browser's timezone is resolved once at module load — it never changes
// within a session and Intl.DateTimeFormat() costs ~40 µs per call.
const BROWSER_TIMEZONE =
  typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

// Similar to DataLinks, this replaces the value of the panel time ranges for use in url params
export const ReplaceTimeMacros = (timeRange: TimeRange, content: string) => {
  // Use global replacements so all occurrences in the URL are substituted,
  // not just the first. A URL with $__from in both path and query would
  // otherwise leave the second reference unreplaced.
  const from = timeRange.raw.from.toString();
  const to = timeRange.raw.to.toString();
  let newContent = content
    .replace(/\$__from/g, () => from)
    .replace(/\$__to/g, () => to)
    .replace(/\$__keepTime/g, () => `from=${from}&to=${to}`);
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
  // When timezone is 'browser', use the module-level cached IANA name —
  // Intl.DateTimeFormat() costs ~40 µs per call, the result never changes.
  const useTimezone = timeZone === 'browser' ? BROWSER_TIMEZONE : timeZone;
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

export const FormatColumnValue = (
  userTimeZone: string,
  columnStyle: ColumnStyleItemType | null,
  field: Field,
  value: any,
  valueType: string): FormattedColumnValue => {

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
  if (columnStyle && columnStyle.metricStyle.decimals !== undefined && columnStyle.metricStyle.decimals !== null) {
    maxDecimals = Number(columnStyle.metricStyle.decimals).valueOf();
  }

  const formatted = applyFormat(value, maxDecimals, useUnit)
  return formatted;
};

export const ProcessClickthrough = (
  columnStyle: ColumnStyleItemType | null,
  rows: FormattedColumnValue[],
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
    const newCell = `<a href="${href}" target="${target}">${processedItem.valueFormatted}</a>`;

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
  if (!cellContent || !cellContent.valueFormatted) {
    return formatted;
  }
  // Replace patterns — use replaceAll so every occurrence of $__pattern_N in
  // the URL is substituted, not just the first (replace() is non-global for
  // plain-string patterns). Also forEach, not map, since we only want side effects.
  const splitByPatternRegex = stringToJsRegex(splitByPattern);
  const values = cellContent.valueFormatted.split(splitByPatternRegex);
  values.forEach((val: string, i: number) => (formatted = formatted.replaceAll(`$__pattern_${i}`, val)));

  return formatted;
}

export const ReplaceCellMacros = (
  clickThrough: string,
  cellContent: string,
  rows: FormattedColumnValue[],
): string => {

  let formatted = clickThrough;
  //
  // Replace $__cell with this cell's content $__cell word boundary
  //
  formatted = formatted.replace(/\$__cell\b/g, () => cellContent);

  //
  // process $__cell_N
  //
  // Single-pass replacement via String.replace() with a callback: the regex
  // engine walks the string once, finds every $__cell_N, and calls the
  // replacer for each match. Because replacement happens inside the engine —
  // not by re-searching a mutated string — injected values that happen to
  // look like $__cell_N are never re-expanded, and a lower-index reference
  // can never accidentally clobber a higher-index one (e.g. $__cell_1 vs
  // $__cell_10). Fixes the multi-reference bug from issue #324 and closes
  // the latent re-substitution hazard in the previous loop-based approach.
  formatted = formatted.replace(/\$__cell_(\d+)/g, (fullMatch, n) => {
    const idx = parseInt(n, 10);
    if (idx >= rows.length) {
      return fullMatch;
    }
    return rows[idx].valueFormatted;
  });
  return formatted;
}

export const applyFormat = (value: any, maxDecimals: number, unitFormat: string) => {
  let valueFormatted = '';
  let valueRounded = NaN;
  let valueRoundedAndFormatted = '';
  const formatFunc = getValueFormat(unitFormat);
  if (formatFunc) {
    const formatted = formatFunc(value, maxDecimals);
    valueFormatted = formatted.text;
    // Call roundValue once and share the result — calling it twice per cell
    // was the dominant cost in applyFormat. Also fixes a latent bug: || treats
    // a legitimate rounded-to-zero result as falsy; ?? does not.
    const rounded = roundValue(value, maxDecimals);
    valueRoundedAndFormatted = rounded ?? value;
    valueRounded = rounded ?? value;
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
