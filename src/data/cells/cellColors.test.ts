import { getCellColors, GetColorAndIndexForValue, GetColorForValue, GetColorIndexForValue } from './cellColors';
import { ColumnStyleColoring, ColumnStyles, ColumnStyleItemType, FormattedColumnValue } from 'types';

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

  it('returns null when thresholds is undefined', () => {
    const noThresholds = metricStyle(ColumnStyleColoring.Cell, undefined as unknown as typeof thresholds);
    expect(GetColorIndexForValue(5, noThresholds)).toBeNull();
  });
});

describe('GetColorAndIndexForValue', () => {
  const thresholds = [
    { value: 0, color: 'green', state: 0 },
    { value: 10, color: 'yellow', state: 1 },
    { value: 20, color: 'red', state: 2 },
  ];
  const style = metricStyle(ColumnStyleColoring.Cell, thresholds);

  it.each([
    [-5, 'green', 0],
    [0, 'green', 0],
    [5, 'green', 0],
    [10, 'yellow', 1],
    [15, 'yellow', 1],
    [20, 'red', 2],
    [999, 'red', 2],
  ])('value=%i → color=%s index=%i', (value, expectedColor, expectedIndex) => {
    const result = GetColorAndIndexForValue(value, style);
    expect(result.color).toBe(expectedColor);
    expect(result.colorIndex).toBe(expectedIndex);
  });

  it('returns null color and index 0 when thresholds is undefined', () => {
    const empty = metricStyle(ColumnStyleColoring.Cell, undefined as unknown as typeof thresholds);
    expect(GetColorAndIndexForValue(5, empty)).toEqual({ color: null, colorIndex: 0 });
  });

  it('returns null color and index 0 when thresholds array is empty', () => {
    const empty = metricStyle(ColumnStyleColoring.Cell, []);
    expect(GetColorAndIndexForValue(5, empty)).toEqual({ color: null, colorIndex: 0 });
  });

  describe('performance', () => {
    it('benchmark: single scan faster than two separate scans', () => {
      const N = 100_000;
      const value = 15;

      const t0 = performance.now();
      for (let i = 0; i < N; i++) {
        GetColorForValue(value, style);
        GetColorIndexForValue(value, style);
      }
      const original = performance.now() - t0;

      const t1 = performance.now();
      for (let i = 0; i < N; i++) {
        GetColorAndIndexForValue(value, style);
      }
      const optimized = performance.now() - t1;

      console.log(`GetColorAndIndex benchmark — original: ${original.toFixed(1)}ms  optimized: ${optimized.toFixed(1)}ms  speedup: ${(original / optimized).toFixed(2)}x`);
      // Guard only when the total time is large enough to be outside JIT variance.
      if (original > 10) {
        expect(optimized).toBeLessThan(original);
      }
    });
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
