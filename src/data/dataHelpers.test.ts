import {
  BuildColumnDefs,
  ConvertDataFrameToDataTableFormat,
  getColumnClassName,
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
      timeRange: {
        from: dateTime(0),
        to: dateTime(0),
        raw: { from: 'now-1h', to: 'now' },
      } as unknown as TimeRange,
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
