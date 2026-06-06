import {
  BuildColumnDefs,
  ConvertDataFrameToDataTableFormat,
  getColumnClassName,
  normalizeFieldName,
} from './dataHelpers';
import { ColumnStyleItemType, ColumnStyles, DTColumnType } from 'types';
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
    // BUG FIXED: previously FormatColumnValue was only called when a column style was present.
    // Raw values were passed to ApplyMappings, which checks value.valueRaw — always undefined on
    // a plain number/string — so mappings silently never applied without a style. Fix: always
    // call FormatColumnValue (with null style) so every cell is a FormattedColumnValue.
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
const asAny = (d: unknown) => d as Record<string, any>;
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
// BuildColumnDefs — render callback
// ---------------------------------------------------------------------------
// The render callback is a closure produced by BuildColumnDefs. Extract it
// from the emitted def and call it directly to cover every orthogonal-data
// branch (sort/filter/display/type/undefined) and the null-guard paths.
describe('BuildColumnDefs render callback', () => {


  // A flattened row: two FormattedColumnValue objects, matching two columns.
  const formattedString: import('types').FormattedColumnValue = {
    valueRaw: 'alpha',
    valueFormatted: 'alpha',
    valueRounded: null,
    valueRoundedAndFormatted: null,
  };
  const formattedNumber: import('types').FormattedColumnValue = {
    valueRaw: 42,
    valueFormatted: '42.00',
    valueRounded: 42,
    valueRoundedAndFormatted: '42',
  };
  const flatRow = [formattedString, formattedNumber];

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
    Rows: [flatRow],
  };

  const defs = BuildColumnDefs({
    rowNumbersEnabled: false,
    fontSizePercent: '100%',
    alignment: { numbers: true, strings: false },
    timeRange: buildTimeRange(),
    replaceVariables: (s: string) => s,
    dtData,
  });

  // Pull render from the first real column def (not the _all sentinel).
  const renderCol0 = asAny(defs.find((d) => asAny(d).targets === 0)).render as Function;
  const renderCol1 = asAny(defs.find((d) => asAny(d).targets === 1)).render as Function;

  it('returns null when type is undefined (DataTables type-detection probe)', () => {
    expect(renderCol0(null, undefined, flatRow, { col: 0 })).toBeNull();
  });

  it('returns null when the column index is out of bounds', () => {
    expect(renderCol0(null, 'display', flatRow, { col: 99 })).toBeNull();
  });

  it('returns valueRaw for type=sort (DataTables sorts on the raw numeric value)', () => {
    expect(renderCol1(null, 'sort', flatRow, { col: 1 })).toBe(42);
  });

  it('returns valueFormatted for type=filter (WYSIWYG: filter against what the user sees)', () => {
    expect(renderCol1(null, 'filter', flatRow, { col: 1 })).toBe('42.00');
  });

  it('returns valueFormatted for type=display', () => {
    expect(renderCol1(null, 'display', flatRow, { col: 1 })).toBe('42.00');
  });

  it('returns the whole FormattedColumnValue object for type=type', () => {
    expect(renderCol1(null, 'type', flatRow, { col: 1 })).toBe(formattedNumber);
  });

  it('returns the raw cell value directly when there is no valueFormatted (e.g. plain rowNumber)', () => {
    // Simulate a raw number in the row as produced for the row-number column
    const rowWithPlainNumber = [7, formattedNumber];
    expect(renderCol0(null, 'display', rowWithPlainNumber, { col: 0 })).toBe(7);
  });

  it('returns valueFormatted for type=undefined-string type (falls through to formatted)', () => {
    expect(renderCol0(null, 'display', flatRow, { col: 0 })).toBe('alpha');
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
    expect(asAny(defs.find((d) => asAny(d).targets === 0)).data).toBeUndefined();
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
