import {
  BuildColumnDefs,
  ConvertDataFrameToDataTableFormat,
  getCellColors,
  GetColorForValue,
  GetColorIndexForValue,
  getColumnClassName,
} from './dataHelpers';
import { ColumnStyleColoring } from 'types';
import { ColumnStyles, ColumnStyleItemType } from 'components/options/columnstyles/types';
import { DTColumnType, FormattedColumnValue } from 'types';
import {
  createTheme,
  dateTime,
  FieldConfigSource,
  FieldType,
  TimeRange,
  toDataFrame,
} from '@grafana/data';

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

// getColumnClassName is the gate that turns the panel-level alignment toggles
// into a DataTables class on each column. The per-column override runs later
// in createdCell as an inline text-align. Pinning the branch table here makes
// the #282 contract (strings can be un-right-aligned) a hard test, not an
// implementation detail that future refactors could silently flip.
describe('getColumnClassName', () => {
  const both = { numbers: true, strings: true };
  const neither = { numbers: false, strings: false };

  it.each([
    ['number', both, 'dt-right'],
    ['number', neither, ''],
    ['number', { numbers: true, strings: false }, 'dt-right'],
    ['string', both, 'dt-right'],
    ['string', neither, ''],
    ['string', { numbers: false, strings: true }, 'dt-right'],
    ['string', { numbers: true, strings: false }, ''],
    // time columns are coerced to number for alignment purposes
    ['time', both, 'dt-right'],
    ['time', neither, ''],
    ['time', { numbers: true, strings: false }, 'dt-right'],
    // date and any other type never get dt-right
    ['date', both, ''],
    ['boolean', both, ''],
  ])('%s column with alignment=%j → %s', (columnType, alignment, expected) => {
    expect(getColumnClassName(alignment, columnType)).toBe(expected);
  });
});

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

describe('ConvertDataFrameToDataTableFormat', () => {
  const theme = createTheme();
  const noopReplaceVariables = (s: string) => s;
  const emptyFieldConfig = { defaults: {}, overrides: [] } as unknown as FieldConfigSource;
  const alignment = { numbers: true, strings: false };

  const twoFieldFrame = () =>
    toDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: [1000, 2000, 3000] },
        { name: 'value', type: FieldType.number, values: [10, 20, 30] },
      ],
    });

  const baseOpts = {
    fieldConfig: emptyFieldConfig,
    userTimeZone: 'utc',
    alignment,
    theme,
    replaceVariables: noopReplaceVariables,
  };

  it('maps each field to a DTColumnType with the class derived from alignment', () => {
    const { columns } = ConvertDataFrameToDataTableFormat({
      ...baseOpts,
      dataFrames: [twoFieldFrame()],
      rowNumbersEnabled: false,
      columnStyles: [],
    });
    expect(columns.map((c) => c.title)).toEqual(['time', 'value']);
    expect(columns.map((c) => c.type)).toEqual(['time', 'number']);
    // Numbers aligned right because alignment.numbers=true; time is coerced to number for class purposes.
    expect(columns.every((c) => c.className === 'dt-right')).toBe(true);
    expect(columns.every((c) => c.visible === true)).toBe(true);
  });

  it('emits one row object per frame row, keyed by normalized field names', () => {
    const { rows } = ConvertDataFrameToDataTableFormat({
      ...baseOpts,
      dataFrames: [twoFieldFrame()],
      rowNumbersEnabled: false,
      columnStyles: [],
    });
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual(expect.objectContaining({ time: 1000, value: 10 }));
    expect(rows[2]).toEqual(expect.objectContaining({ time: 3000, value: 30 }));
  });

  it('prepends a rowNumber column and stamps row indices when rowNumbersEnabled', () => {
    const { columns, rows } = ConvertDataFrameToDataTableFormat({
      ...baseOpts,
      dataFrames: [twoFieldFrame()],
      rowNumbersEnabled: true,
      columnStyles: [],
    });
    expect(columns[0]).toEqual(
      expect.objectContaining({ title: 'row', data: 'rowNumber', widthHint: '1%' }),
    );
    expect(columns).toHaveLength(3); // rowNumber + 2 data fields
    expect(rows.map((r) => r.rowNumber)).toEqual([1, 2, 3]);
  });

  it('hides a column when its matched style is HIDDEN (only via rowNumbers branch)', () => {
    // The visibility toggle lives in the `if (rowNumbersEnabled)` block —
    // matches the current implementation even though the location is
    // arguably a bug. Pin observed behaviour rather than pretend.
    const hiddenStyle = {
      activeStyle: ColumnStyles.HIDDEN,
      enabled: true,
      label: 'hide-value',
      nameOrRegex: 'value',
      order: 0,
      dateStyle: {},
      hiddenStyle: {},
      metricStyle: {},
      stringStyle: {},
    } as unknown as ColumnStyleItemType;

    const { columns } = ConvertDataFrameToDataTableFormat({
      ...baseOpts,
      dataFrames: [twoFieldFrame()],
      rowNumbersEnabled: true,
      columnStyles: [hiddenStyle],
    });
    const valueCol = columns.find((c) => c.title === 'value');
    expect(valueCol?.visible).toBe(false);
  });
});

describe('BuildColumnDefs', () => {
  // Minimal DTData fixture — two columns, one data row.
  const dtData = {
    Columns: [
      {
        title: 'name',
        data: 'name',
        type: 'string',
        className: '',
        columnStyles: [],
        widthHint: '',
        visible: true,
      } as DTColumnType,
      {
        title: 'value',
        data: 'value',
        type: 'number',
        className: '',
        columnStyles: [],
        widthHint: '',
        visible: true,
      } as DTColumnType,
    ],
    Rows: [{ name: 'A', value: 1 }],
  };

  // `ConfigColumnDefs` from datatables.net is a narrow union that doesn't
  // expose an index signature, so probing runtime properties needs a cast.
  // Factor it once so the assertions below stay readable.
  const asRecord = (d: unknown) => d as Record<string, unknown>;

  // Pins the options-object API so a future refactor can't silently revert to
  // positional args. Also asserts the sentinel `{ targets: '_all' }` entry
  // that BuildColumnDefs appends — DataTables relies on it to suppress a
  // "unknown column" dialog when toggling the row-number column at runtime.
  it('accepts a BuildColumnDefsOptions object and emits one def per column plus the _all sentinel', () => {
    const defs = BuildColumnDefs({
      rowNumbersEnabled: false,
      fontSizePercent: '100%',
      alignment: { numbers: true, strings: false },
      timeRange: {
        from: dateTime(0),
        to: dateTime(0),
        raw: { from: 'now-1h', to: 'now' },
      } as unknown as TimeRange,
      replaceVariables: (s: string) => s,
      dtData,
    });

    // 2 column defs + 1 sentinel
    expect(defs).toHaveLength(3);
    const realDefs = defs.filter((d) => asRecord(d).targets !== '_all');
    expect(realDefs).toHaveLength(2);
    expect(realDefs.map((d) => asRecord(d).targets)).toEqual([0, 1]);

    const sentinel = defs.find((d) => asRecord(d).targets === '_all');
    expect(sentinel).toBeDefined();
    expect(asRecord(sentinel).defaultContent).toBe('-');
  });
});
