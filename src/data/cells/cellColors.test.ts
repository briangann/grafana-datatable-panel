import { getCellColors, GetColorForValue, GetColorIndexForValue } from './cellColors';
import { ColumnStyleColoring, ColumnStyles, ColumnStyleItemType } from 'types';
import { FormattedColumnValue } from '../types';

const metricStyle = (
  colorMode: ColumnStyleColoring | undefined,
  thresholds: Array<{ value: number; color: string; state: number }>,
): ColumnStyleItemType =>
  ({
    activeStyle: ColumnStyles.METRIC,
    metricStyle: {
      colorMode,
      thresholds,
      colors: [],
      decimals: '2',
      scaledDecimals: null,
      unitFormat: 'short',
      ignoreNullValues: true,
      alias: '',
    },
  } as unknown as ColumnStyleItemType);

const cell = (raw: number | string | null): FormattedColumnValue =>
  ({
    valueRaw: raw,
    valueFormatted: String(raw),
    valueRounded: null,
    valueRoundedAndFormatted: null,
  } as FormattedColumnValue);

describe('GetColorForValue', () => {
  const thresholds = [
    { value: 0, color: 'green', state: 0 },
    { value: 10, color: 'yellow', state: 1 },
    { value: 20, color: 'red', state: 2 },
  ];
  const style = metricStyle(ColumnStyleColoring.Cell, thresholds);

  it.each([
    [-5, 'green'],
    [0, 'green'],
    [5, 'green'],
    [10, 'yellow'],
    [15, 'yellow'],
    [20, 'red'],
    [999, 'red'],
  ])('value=%i → color=%s', (value, expected) => {
    expect(GetColorForValue(value, style)).toBe(expected);
  });

  it('returns null when no thresholds are defined', () => {
    const empty = metricStyle(ColumnStyleColoring.Cell, undefined as unknown as typeof thresholds);
    expect(GetColorForValue(5, empty)).toBeNull();
  });
});

describe('GetColorIndexForValue', () => {
  const thresholds = [
    { value: 0, color: 'green', state: 0 },
    { value: 10, color: 'yellow', state: 1 },
    { value: 20, color: 'red', state: 2 },
  ];
  const style = metricStyle(ColumnStyleColoring.Cell, thresholds);

  it.each([
    [-5, 0],
    [5, 0],
    [10, 1],
    [15, 1],
    [20, 2],
    [100, 2],
  ])('value=%i → index=%i', (value, expected) => {
    expect(GetColorIndexForValue(value, style)).toBe(expected);
  });
});

describe('getCellColors', () => {
  const thresholds = [
    { value: 0, color: 'green', state: 0 },
    { value: 50, color: 'red', state: 1 },
  ];

  it('returns null for a null column style', () => {
    expect(getCellColors(null, cell(42))).toBeNull();
  });

  it('returns null for a non-metric column', () => {
    const stringStyle = { ...metricStyle(ColumnStyleColoring.Cell, thresholds), activeStyle: ColumnStyles.STRING };
    expect(getCellColors(stringStyle, cell(42))).toBeNull();
  });

  it('returns bgColor + white text when colorMode=Cell and value in high band', () => {
    const style = metricStyle(ColumnStyleColoring.Cell, thresholds);
    const result = getCellColors(style, cell(75));
    expect(result).toEqual({ bgColor: 'red', bgColorIndex: 1, color: 'white', colorIndex: null });
  });

  it('returns color on text (no bg) when colorMode=Value', () => {
    const style = metricStyle(ColumnStyleColoring.Value, thresholds);
    const result = getCellColors(style, cell(75));
    expect(result).toEqual({ bgColor: null, bgColorIndex: null, color: 'red', colorIndex: 1 });
  });

  it('leaves colors unset when colorMode=Disabled', () => {
    // Disabled is not one of Cell/Row/RowColumn/Value — the outer `if` only
    // enters when thresholds exist, but neither inner branch matches, so
    // every color field stays null.
    const style = metricStyle(ColumnStyleColoring.Disabled, thresholds);
    expect(getCellColors(style, cell(75))).toEqual({
      bgColor: null,
      bgColorIndex: null,
      color: null,
      colorIndex: null,
    });
  });

  it('skips coloring when valueRaw is null', () => {
    const style = metricStyle(ColumnStyleColoring.Cell, thresholds);
    const result = getCellColors(style, cell(null));
    // bg/color stay null, but color is still set to 'white' because the
    // colorMode triggered the Cell branch regardless of value validity.
    expect(result).toEqual({ bgColor: null, bgColorIndex: null, color: 'white', colorIndex: null });
  });

  it('returns null when cellData is null', () => {
    const style = metricStyle(ColumnStyleColoring.Cell, thresholds);
    expect(getCellColors(style, null as unknown as FormattedColumnValue)).toBeNull();
  });
});
