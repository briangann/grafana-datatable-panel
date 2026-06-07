import {
  BuildColumnDefs,
  ConvertDataFrameToDataTableFormat,
  getColumnClassName,
  markHiddenColumns,
  normalizeFieldName,
  prependRowNumbers,
  resolveColumnValue,
  wrapRawValue,
} from './dataHelpers';
import { ColumnStyleItemType, ColumnStyles, DTColumnType, FormattedColumnValue, NamedRow } from 'types';
import {
  createTheme,
  dateTime,
  FieldConfigSource,
  FieldType,
  TimeRange,
  toDataFrame,
} from '@grafana/data';

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

  it('wraps every cell in FormattedColumnValue so render/mappings work uniformly, keyed by normalized field name', () => {
    // BUG FIXED: previously cells without a column style were stored as raw primitives.
    // ApplyMappings checks value.valueRaw — always undefined on a plain number/string —
    // so mappings silently never applied without a style. Fix: manually wrap every cell in
    // a minimal FormattedColumnValue (without calling FormatColumnValue, to avoid applying
    // the plugin's default date format and overriding Grafana field overrides for time fields).
    const { rows } = ConvertDataFrameToDataTableFormat({
      ...baseOpts,
      dataFrames: [twoFieldFrame()],
      rowNumbersEnabled: false,
      columnStyles: [],
    });
    expect(rows).toHaveLength(3);
    // Every cell is a FormattedColumnValue, not a raw primitive
    expect(rows[0].time).toMatchObject({ valueRaw: 1000 });
    expect(rows[0].value).toMatchObject({ valueRaw: 10 });
    expect(rows[2].time).toMatchObject({ valueRaw: 3000 });
    expect(rows[2].value).toMatchObject({ valueRaw: 30 });
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

  it('hides a column when its matched style is HIDDEN, regardless of rowNumbersEnabled', () => {
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

    // Works without rowNumbersEnabled (the bug was that visible=false was only
    // set inside the rowNumbersEnabled block).
    const { columns: colsNoRows } = ConvertDataFrameToDataTableFormat({
      ...baseOpts,
      dataFrames: [twoFieldFrame()],
      rowNumbersEnabled: false,
      columnStyles: [hiddenStyle],
    });
    expect(colsNoRows.find((c) => c.title === 'value')?.visible).toBe(false);

    // Also works with rowNumbersEnabled for completeness.
    const { columns: colsWithRows } = ConvertDataFrameToDataTableFormat({
      ...baseOpts,
      dataFrames: [twoFieldFrame()],
      rowNumbersEnabled: true,
      columnStyles: [hiddenStyle],
    });
    expect(colsWithRows.find((c) => c.title === 'value')?.visible).toBe(false);
  });
});

// Shared test fixtures — used across multiple describe blocks below.
const asAny = (d: unknown) => d as Record<string, unknown>;
const buildTimeRange = () =>
  ({ from: dateTime(0), to: dateTime(0), raw: { from: 'now-1h', to: 'now' } } as unknown as TimeRange);

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
    Rows: [[
      { valueRaw: 'A', valueFormatted: 'A', valueRounded: null, valueRoundedAndFormatted: null },
      { valueRaw: 1,   valueFormatted: '1', valueRounded: 1,    valueRoundedAndFormatted: '1'  },
    ]],
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
      timeRange: buildTimeRange(),
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
  it('emits visible:false on the column def when DTColumnType.visible is false', () => {
    // Bug: ConvertDataFrameToDataTableFormat correctly sets column.visible=false
    // when a HIDDEN style matches, but BuildColumnDefs never reads that flag —
    // so the DataTables column def lacks visible:false and the column stays visible.
    //
    // This test proves the gap: given a dtData with the second column marked
    // visible:false, the emitted columnDef for that column must include visible:false.
    const dtDataWithHidden = {
      ...dtData,
      Columns: [
        { ...dtData.Columns[0] },
        { ...dtData.Columns[1], visible: false }, // marked hidden by ConvertDataFrameToDataTableFormat
      ],
    };

    const defs = BuildColumnDefs({
      rowNumbersEnabled: false,
      fontSizePercent: '100%',
      alignment: { numbers: true, strings: false },
      timeRange: buildTimeRange(),
      replaceVariables: (s: string) => s,
      dtData: dtDataWithHidden,
    });

    const realDefs = defs.filter((d) => asRecord(d).targets !== '_all');
    // The second column def (targets: 1) must carry visible:false
    const hiddenDef = realDefs.find((d) => asRecord(d).targets === 1);
    expect(hiddenDef).toBeDefined();
    expect(asRecord(hiddenDef).visible).toBe(false);

    // The first column def must NOT carry visible:false
    const visibleDef = realDefs.find((d) => asRecord(d).targets === 0);
    expect(asRecord(visibleDef).visible).not.toBe(false);
  });
});
describe('ConvertDataFrameToDataTableFormat + rowNumbers column index contract', () => {
  // Pins the contract that DataTablePanel.tsx's initComplete loop must honour:
  // when rowNumbersEnabled=true, the row-number column is prepended at index 0
  // in the columns array, so iterating with index i gives the correct DataTables
  // column index directly — no additional offset should be applied.
  //
  // Bug caught: initComplete used `api.column(i + rowNumberOffset)` where
  // rowNumberOffset = rowNumbersEnabled ? 1 : 0. With rowNumbersEnabled=true
  // and i=1 (first data column), that called api.column(2) instead of
  // api.column(1), hiding the wrong column.
  const theme = createTheme();
  const noopReplaceVariables = (s: string) => s;
  const emptyFieldConfig = { defaults: {}, overrides: [] } as unknown as FieldConfigSource;
  const alignment = { numbers: true, strings: false };

  const threeFieldFrame = () =>
    toDataFrame({
      fields: [
        { name: 'time',  type: FieldType.time,   values: [1000] },
        { name: 'host',  type: FieldType.string, values: ['alpha'] },
        { name: 'value', type: FieldType.number, values: [42] },
      ],
    });

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

  it('with rowNumbersEnabled: row-number column is at array index 0 and data columns follow without an additional offset', () => {
    // When rowNumbersEnabled, ConvertDataFrameToDataTableFormat prepends the
    // row-number column at index 0. The hidden "value" column ends up at index 3
    // (0=row, 1=time, 2=host, 3=value). The correct DataTables call to hide it
    // is api.column(3).visible(false) — no extra +1 offset.
    const { columns } = ConvertDataFrameToDataTableFormat({
      fieldConfig: emptyFieldConfig,
      userTimeZone: 'utc',
      alignment,
      dataFrames: [threeFieldFrame()],
      rowNumbersEnabled: true,
      columnStyles: [hiddenStyle],
      theme,
      replaceVariables: noopReplaceVariables,
    });

    // Row-number column at position 0, visible=true
    expect(columns[0].title).toBe('row');
    expect(columns[0].visible).toBe(true);

    // Hidden "value" column at position 3
    const hiddenIdx = columns.findIndex((c) => c.title === 'value');
    expect(hiddenIdx).toBe(3);
    expect(columns[hiddenIdx].visible).toBe(false);

    // Contract: the correct DataTables column index is hiddenIdx itself (3),
    // NOT hiddenIdx + 1 (4). The initComplete loop must use api.column(i),
    // not api.column(i + rowNumberOffset).
    //
    // If the loop incorrectly adds rowNumberOffset=1, it would try to hide
    // column 4 which does not exist in a 4-column table (indices 0-3).
    expect(hiddenIdx).toBe(3);           // correct: api.column(3)
    expect(hiddenIdx + 1).not.toBe(3);   // wrong:   api.column(4) — off by one
  });

  it('with rowNumbersEnabled=false: hidden column index is correct without any offset', () => {
    const { columns } = ConvertDataFrameToDataTableFormat({
      fieldConfig: emptyFieldConfig,
      userTimeZone: 'utc',
      alignment,
      dataFrames: [threeFieldFrame()],
      rowNumbersEnabled: false,
      columnStyles: [hiddenStyle],
      theme,
      replaceVariables: noopReplaceVariables,
    });
    const hiddenIdx = columns.findIndex((c) => c.title === 'value');
    expect(hiddenIdx).toBe(2);  // time=0, host=1, value=2
    expect(columns[hiddenIdx].visible).toBe(false);
    // No offset: api.column(2) is correct
  });
});


// ---------------------------------------------------------------------------
// normalizeFieldName
// ---------------------------------------------------------------------------
describe('normalizeFieldName', () => {
  it('replaces spaces with underscores', () => {
    expect(normalizeFieldName('hello world')).toBe('hello_world');
  });

  it('collapses multiple spaces to multiple underscores', () => {
    expect(normalizeFieldName('a  b')).toBe('a__b');
  });

  it('removes special characters', () => {
    expect(normalizeFieldName('cpu%usage')).toBe('cpuusage');
  });

  it('removes dots and hyphens', () => {
    expect(normalizeFieldName('my.field-name')).toBe('myfieldname');
  });

  it('lowercases the result', () => {
    expect(normalizeFieldName('CPU_Usage')).toBe('cpu_usage');
  });

  it('preserves leading and embedded numbers', () => {
    expect(normalizeFieldName('123abc')).toBe('123abc');
    expect(normalizeFieldName('mem_used_2')).toBe('mem_used_2');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeFieldName('')).toBe('');
  });

  it('already-normalized name passes through unchanged', () => {
    expect(normalizeFieldName('cpu_usage')).toBe('cpu_usage');
  });

  it('strips parentheses and brackets', () => {
    expect(normalizeFieldName('bytes(total)')).toBe('bytestotal');
    expect(normalizeFieldName('bytes[0]')).toBe('bytes0');
  });

  it('strips unicode characters outside the allowed set', () => {
    expect(normalizeFieldName('tëst')).toBe('tst');
  });
});

// ---------------------------------------------------------------------------
// BuildColumnDefs — no data callback (removed: always returned null,
// render() ignores _data and accesses val[idx] directly)
// ---------------------------------------------------------------------------
describe('BuildColumnDefs — no data callback', () => {
  it('emitted def has no data property — DataTables falls back to raw row element', () => {
    const dtData = {
      Columns: [{ title: 'v', data: 'v', type: 'number', className: '', columnStyles: [], widthHint: '', visible: true } as DTColumnType],
      Rows: [[{ valueRaw: 1, valueFormatted: '1', valueRounded: 1, valueRoundedAndFormatted: '1' }]],
    };
    const defs = BuildColumnDefs({
      rowNumbersEnabled: false, fontSizePercent: '100%', alignment: { numbers: true, strings: false },
      timeRange: buildTimeRange(), replaceVariables: (s: string) => s, dtData,
    });
    const colDef = defs.find((d) => asAny(d).targets === 0);
    // Positive contract: the def was found and has a render function.
    expect(typeof asAny(colDef).render).toBe('function');
    // data accessor must be absent — DataTables falls back to the raw row array element.
    // Structural proof of the createdCell columnsInCellData bug fix: without a `data`
    // accessor, DataTables passes row[col] (a FormattedColumnValue | number) as the
    // second argument (cellData) to createdCell — NOT a DTColumnType[]. The old code
    // used that argument as columnsInCellData[colIndex] to look up the column def, so
    // aColumn was always undefined and all cell styling (colors, alignment) was
    // unreachable. The fix sources aColumn from dtData.Columns[colIndex] instead.
    expect(Object.prototype.hasOwnProperty.call(colDef, 'data')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ConvertDataFrameToDataTableFormat — edge cases
// ---------------------------------------------------------------------------
describe('ConvertDataFrameToDataTableFormat — edge cases', () => {
  const theme = createTheme();
  const noopReplaceVariables = (s: string) => s;
  const emptyFieldConfig = { defaults: {}, overrides: [] } as unknown as FieldConfigSource;
  const alignment = { numbers: false, strings: false };

  it('handles a frame with zero rows — emits columns but no rows', () => {
    const emptyFrame = toDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: [] },
        { name: 'value', type: FieldType.number, values: [] },
      ],
    });
    const { columns, rows } = ConvertDataFrameToDataTableFormat({
      dataFrames: [emptyFrame],
      fieldConfig: emptyFieldConfig,
      userTimeZone: 'utc',
      alignment,
      rowNumbersEnabled: false,
      columnStyles: [],
      theme,
      replaceVariables: noopReplaceVariables,
    });
    expect(columns).toHaveLength(2);
    expect(rows).toHaveLength(0);
  });

  it('uses only the first DataFrame when multiple are provided', () => {
    const frame1 = toDataFrame({
      fields: [{ name: 'a', type: FieldType.number, values: [1] }],
    });
    const frame2 = toDataFrame({
      fields: [
        { name: 'b', type: FieldType.number, values: [2] },
        { name: 'c', type: FieldType.number, values: [3] },
      ],
    });
    const { columns } = ConvertDataFrameToDataTableFormat({
      dataFrames: [frame1, frame2],
      fieldConfig: emptyFieldConfig,
      userTimeZone: 'utc',
      alignment,
      rowNumbersEnabled: false,
      columnStyles: [],
      theme,
      replaceVariables: noopReplaceVariables,
    });
    // Only frame1's columns should be present
    expect(columns.map((c) => c.title)).toEqual(['a']);
  });

  it('normalizes field names with spaces and special chars as row keys', () => {
    const frame = toDataFrame({
      fields: [{ name: 'my field!', type: FieldType.string, values: ['x'] }],
    });
    const { columns, rows } = ConvertDataFrameToDataTableFormat({
      dataFrames: [frame],
      fieldConfig: emptyFieldConfig,
      userTimeZone: 'utc',
      alignment,
      rowNumbersEnabled: false,
      columnStyles: [],
      theme,
      replaceVariables: noopReplaceVariables,
    });
    expect(columns[0].data).toBe('my_field');
    // The row is keyed by the normalized name
    expect(Object.keys(rows[0])).toContain('my_field');
  });

  it('applies field-level value mappings when present', () => {
    const fieldConfig = {
      defaults: {
        mappings: [
          {
            type: 'value',
            options: { '42': { text: 'forty-two', index: 0 } },
          },
        ],
      },
      overrides: [],
    } as unknown as FieldConfigSource;

    const frame = toDataFrame({
      fields: [{ name: 'v', type: FieldType.number, values: [42] }],
    });
    const { rows } = ConvertDataFrameToDataTableFormat({
      dataFrames: [frame],
      fieldConfig,
      userTimeZone: 'utc',
      alignment,
      rowNumbersEnabled: false,
      columnStyles: [],
      theme,
      replaceVariables: noopReplaceVariables,
    });
    // The mapping should replace the formatted value with 'forty-two'
    expect((rows[0].v as import('types').FormattedColumnValue).valueFormatted).toBe('forty-two');
  });

  it('formats string fields as FormattedColumnValue with valueFormatted === valueRaw', () => {
    const frame = toDataFrame({
      fields: [{ name: 'host', type: FieldType.string, values: ['server-1', 'server-2'] }],
    });
    const { rows } = ConvertDataFrameToDataTableFormat({
      dataFrames: [frame],
      fieldConfig: emptyFieldConfig,
      userTimeZone: 'utc',
      alignment,
      rowNumbersEnabled: false,
      columnStyles: [],
      theme,
      replaceVariables: noopReplaceVariables,
    });
    const host0 = rows[0].host as import('types').FormattedColumnValue;
    const host1 = rows[1].host as import('types').FormattedColumnValue;
    expect(host0.valueRaw).toBe('server-1');
    expect(host0.valueFormatted).toBe('server-1');
    expect(host1.valueFormatted).toBe('server-2');
  });

  it('rowNumber values start at 1, not 0', () => {
    const frame = toDataFrame({
      fields: [{ name: 'v', type: FieldType.number, values: [10, 20, 30] }],
    });
    const { rows } = ConvertDataFrameToDataTableFormat({
      dataFrames: [frame],
      fieldConfig: emptyFieldConfig,
      userTimeZone: 'utc',
      alignment,
      rowNumbersEnabled: true,
      columnStyles: [],
      theme,
      replaceVariables: noopReplaceVariables,
    });
    expect(rows.map((r) => r.rowNumber)).toEqual([1, 2, 3]);
  });

  it('valueFormatted is always a string, even for numeric raw values (no-style path)', () => {
    const frame = toDataFrame({
      fields: [{ name: 'count', type: FieldType.number, values: [42, 0, 100] }],
    });
    const { rows } = ConvertDataFrameToDataTableFormat({
      dataFrames: [frame],
      fieldConfig: emptyFieldConfig,
      userTimeZone: 'utc',
      alignment,
      rowNumbersEnabled: false,
      columnStyles: [],
      theme,
      replaceVariables: noopReplaceVariables,
    });
    for (const row of rows) {
      const cell = row.count as import('types').FormattedColumnValue;
      expect(typeof cell.valueFormatted).toBe('string');
    }
  });

  it('null rawValue produces valueFormatted="" (no-style path)', () => {
    const frame = toDataFrame({
      fields: [{ name: 'v', type: FieldType.number, values: [null] }],
    });
    const { rows } = ConvertDataFrameToDataTableFormat({
      dataFrames: [frame],
      fieldConfig: emptyFieldConfig,
      userTimeZone: 'utc',
      alignment,
      rowNumbersEnabled: false,
      columnStyles: [],
      theme,
      replaceVariables: noopReplaceVariables,
    });
    const cell = rows[0].v as import('types').FormattedColumnValue;
    expect(cell.valueFormatted).toBe('');
    expect(cell.valueRaw).toBeNull();
  });

  it('object rawValue produces valueFormatted="" rather than "[object Object]" (no-style path)', () => {
    // Some Grafana transformations can produce object-valued fields (e.g. nested data).
    // Passing an object to String() gives '[object Object]' which is useless as display text.
    const frame = toDataFrame({
      fields: [{ name: 'nested', type: FieldType.other, values: [{ a: 1 }] }],
    });
    const { rows } = ConvertDataFrameToDataTableFormat({
      dataFrames: [frame],
      fieldConfig: emptyFieldConfig,
      userTimeZone: 'utc',
      alignment,
      rowNumbersEnabled: false,
      columnStyles: [],
      theme,
      replaceVariables: noopReplaceVariables,
    });
    const cell = rows[0].nested as import('types').FormattedColumnValue;
    expect(cell.valueFormatted).toBe('');
    expect(cell.valueRaw).toEqual({ a: 1 });
  });
});

// ---------------------------------------------------------------------------
// BuildColumnDefs — column type coercion
// ---------------------------------------------------------------------------
describe('BuildColumnDefs — column type coercion', () => {
  it('coerces time column type to number (DataTables "date" type limits formatting)', () => {
    const dtData = {
      Columns: [
        { title: 'ts', data: 'ts', type: 'time', className: '', columnStyles: [], widthHint: '', visible: true } as DTColumnType,
      ],
      Rows: [[{ valueRaw: 1000, valueFormatted: '2020-01-01', valueRounded: null, valueRoundedAndFormatted: null }]],
    };
    const defs = BuildColumnDefs({
      rowNumbersEnabled: false, fontSizePercent: '100%', alignment: { numbers: false, strings: false },
      timeRange: buildTimeRange(), replaceVariables: (s: string) => s, dtData,
    });
    const colDef = defs.find((d) => asAny(d).targets === 0);
    expect(asAny(colDef).type).toBe('number');
  });

  it('the _all sentinel always has defaultContent "-"', () => {
    const dtData = {
      Columns: [
        { title: 'v', data: 'v', type: 'number', className: '', columnStyles: [], widthHint: '', visible: true } as DTColumnType,
      ],
      Rows: [[1]],
    };
    const defs = BuildColumnDefs({
      rowNumbersEnabled: false, fontSizePercent: '100%', alignment: { numbers: false, strings: false },
      timeRange: buildTimeRange(), replaceVariables: (s: string) => s, dtData,
    });
    const sentinel = defs.find((d) => asAny(d).targets === '_all');
    expect(asAny(sentinel).defaultContent).toBe('-');
  });
});

// ---------------------------------------------------------------------------
// wrapRawValue
// ---------------------------------------------------------------------------
describe('wrapRawValue', () => {
  it('wraps a number: valueFormatted is the string form of the number', () => {
    const result = wrapRawValue(42);
    expect(result).toEqual({ valueRaw: 42, valueFormatted: '42', valueRounded: null, valueRoundedAndFormatted: null });
  });

  it('wraps a string: valueFormatted equals the original string', () => {
    const result = wrapRawValue('hello');
    expect(result).toEqual({ valueRaw: 'hello', valueFormatted: 'hello', valueRounded: null, valueRoundedAndFormatted: null });
  });

  it('wraps null: valueFormatted is "" (null == null guard)', () => {
    const result = wrapRawValue(null);
    expect(result).toEqual({ valueRaw: null, valueFormatted: '', valueRounded: null, valueRoundedAndFormatted: null });
  });

  it('wraps undefined: valueFormatted is "" (undefined == null)', () => {
    // undefined != null uses loose equality, which is false for undefined vs null → false → ''
    const result = wrapRawValue(undefined);
    expect(result.valueFormatted).toBe('');
    expect(result.valueRaw).toBeUndefined();
  });

  it('wraps 0: valueFormatted is "0" (0 is not null and not object)', () => {
    const result = wrapRawValue(0);
    expect(result).toEqual({ valueRaw: 0, valueFormatted: '0', valueRounded: null, valueRoundedAndFormatted: null });
  });

  it('wraps false: valueFormatted is "false"', () => {
    const result = wrapRawValue(false);
    expect(result).toEqual({ valueRaw: false, valueFormatted: 'false', valueRounded: null, valueRoundedAndFormatted: null });
  });

  it('wraps an object: valueFormatted is "" (never "[object Object]")', () => {
    const obj = { a: 1 };
    const result = wrapRawValue(obj);
    expect(result.valueFormatted).toBe('');
    expect(result.valueRaw).toBe(obj);
  });

  it('wraps an array: valueFormatted is "" (arrays are objects)', () => {
    const arr = [1, 2, 3];
    const result = wrapRawValue(arr);
    expect(result.valueFormatted).toBe('');
    expect(result.valueRaw).toBe(arr);
  });
});

// ---------------------------------------------------------------------------
// resolveColumnValue
// ---------------------------------------------------------------------------
describe('resolveColumnValue', () => {
  // A minimal DTColumnType with no column styles — exercises the wrapRawValue path.
  const noStyleColumn: DTColumnType = {
    title: 'v',
    data: 'v',
    type: 'number',
    className: '',
    fieldConfig: {},
    columnStyles: [],
    widthHint: '',
    visible: true,
  };

  // frameField is only used by FormatColumnValue (column-style path).
  // In the no-style path it is never read, so a dummy is safe.
  const dummyField = {} as any;

  it('no style + no mappings → wraps the raw value', () => {
    const result = resolveColumnValue('utc', noStyleColumn, dummyField, 99, 'number', undefined);
    expect(result).toEqual<FormattedColumnValue>({
      valueRaw: 99,
      valueFormatted: '99',
      valueRounded: null,
      valueRoundedAndFormatted: null,
    });
  });

  it('no style + no mappings + null rawValue → valueFormatted is ""', () => {
    const result = resolveColumnValue('utc', noStyleColumn, dummyField, null, 'number', undefined);
    expect(result.valueRaw).toBeNull();
    expect(result.valueFormatted).toBe('');
  });

  it('no style + matching mapping → valueFormatted is the mapped text', () => {
    // ApplyMappings requires valueRaw to be truthy; use a non-zero number.
    const mappings = [{ type: 'value', options: { '42': { text: 'forty-two', index: 0 } } }] as any;
    const result = resolveColumnValue('utc', noStyleColumn, dummyField, 42, 'number', mappings);
    expect(result.valueFormatted).toBe('forty-two');
    expect(result.valueRaw).toBe(42);
  });

  it('no style + non-matching mapping → returns the plain wrapped value unchanged', () => {
    const mappings = [{ type: 'value', options: { '99': { text: 'ninety-nine', index: 0 } } }] as any;
    // rawValue 7 does not match key '99', so mapping returns null → value unchanged.
    const result = resolveColumnValue('utc', noStyleColumn, dummyField, 7, 'number', mappings);
    expect(result.valueFormatted).toBe('7');
  });

  it('no style + rawValue=0 → mapping fires (0 is a valid value, not treated as absent)', () => {
    // Fixed: valueRaw=0 is falsy but is a valid data value. ApplyMappings now uses
    // `=== null || === undefined` instead of a truthiness check so 0 maps correctly.
    const mappings = [{ type: 'value', options: { '0': { text: 'zero', index: 0 } } }] as any;
    const result = resolveColumnValue('utc', noStyleColumn, dummyField, 0, 'number', mappings);
    expect(result.valueFormatted).toBe('zero');
  });
});

// ---------------------------------------------------------------------------
// markHiddenColumns
// ---------------------------------------------------------------------------
describe('markHiddenColumns', () => {
  const makeColumn = (activeStyle: ColumnStyles | null, visible = true): DTColumnType => ({
    title: 'x',
    data: 'x',
    type: 'string',
    className: '',
    fieldConfig: {},
    widthHint: '',
    visible,
    columnStyles: activeStyle !== null
      ? [{ activeStyle } as unknown as ColumnStyleItemType]
      : [],
  });

  it('sets visible=false on a column whose first style is HIDDEN', () => {
    const cols = [makeColumn(ColumnStyles.HIDDEN)];
    markHiddenColumns(cols);
    expect(cols[0].visible).toBe(false);
  });

  it('leaves visible=true on a column with a non-HIDDEN style (METRIC)', () => {
    const cols = [makeColumn(ColumnStyles.METRIC)];
    markHiddenColumns(cols);
    expect(cols[0].visible).toBe(true);
  });

  it('leaves visible=true on a column with no styles', () => {
    const cols = [makeColumn(null)];
    markHiddenColumns(cols);
    expect(cols[0].visible).toBe(true);
  });

  it('processes each column independently in a mixed array', () => {
    const cols = [
      makeColumn(ColumnStyles.HIDDEN),
      makeColumn(ColumnStyles.METRIC),
      makeColumn(null),
    ];
    markHiddenColumns(cols);
    expect(cols[0].visible).toBe(false);
    expect(cols[1].visible).toBe(true);
    expect(cols[2].visible).toBe(true);
  });

  it('is a no-op on an empty array', () => {
    expect(() => markHiddenColumns([])).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// prependRowNumbers
// ---------------------------------------------------------------------------
describe('prependRowNumbers', () => {
  const makeCol = (data: string): DTColumnType => ({
    title: data,
    data,
    type: 'number',
    className: '',
    fieldConfig: {},
    columnStyles: [],
    widthHint: '',
    visible: true,
  });

  it('prepends a rowNumber column as the first element', () => {
    const cols = [makeCol('v')];
    const rows: NamedRow[] = [{ v: 10 }];
    prependRowNumbers(cols, rows);
    expect(cols).toHaveLength(2);
    expect(cols[0].data).toBe('rowNumber');
    expect(cols[1].data).toBe('v');
  });

  it('stamps 1-based rowNumber on each row', () => {
    const cols = [makeCol('v')];
    const rows: NamedRow[] = [{ v: 10 }, { v: 20 }, { v: 30 }];
    prependRowNumbers(cols, rows);
    expect(rows[0].rowNumber).toBe(1);
    expect(rows[1].rowNumber).toBe(2);
    expect(rows[2].rowNumber).toBe(3);
  });

  it('rowNumber column has widthHint "1%" and type "number"', () => {
    const cols = [makeCol('v')];
    const rows: NamedRow[] = [{ v: 1 }];
    prependRowNumbers(cols, rows);
    expect(cols[0].widthHint).toBe('1%');
    expect(cols[0].type).toBe('number');
  });

  it('stamps all rows (every row gets a 1-based rowNumber)', () => {
    const cols = [makeCol('v')];
    const rows: NamedRow[] = [{ v: 1 }, { v: 2 }];
    prependRowNumbers(cols, rows);
    expect(rows[0].rowNumber).toBe(1);
    expect(rows[1].rowNumber).toBe(2);
  });

  it('is a no-op on rows when rows array is empty', () => {
    const cols = [makeCol('v')];
    const rows: NamedRow[] = [];
    prependRowNumbers(cols, rows);
    expect(cols[0].data).toBe('rowNumber');
    expect(rows).toHaveLength(0);
  });
});
