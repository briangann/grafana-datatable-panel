import $ from 'jquery';
import { renderCell, applyCreatedCell, CreatedCellContext } from './columnDefCallbacks';
import {
  ColumnAlignment,
  ColumnStyleColoring,
  ColumnStyleItemType,
  ColumnStyles,
  DTColumnType,
  DTData,
  FlatRow,
  FormattedColumnValue,
  Threshold,
} from 'types';
import { CellMetaSettings } from 'datatables.net';
import { TimeRange } from '@grafana/data';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const formattedString: FormattedColumnValue = {
  valueRaw: 'alpha',
  valueFormatted: 'alpha',
  valueRounded: null,
  valueRoundedAndFormatted: null,
};
const formattedNumber: FormattedColumnValue = {
  valueRaw: 42,
  valueFormatted: '42.00',
  valueRounded: 42,
  valueRoundedAndFormatted: '42',
};
const nullCell: FormattedColumnValue = {
  valueRaw: null,
  valueFormatted: '',
  valueRounded: null,
  valueRoundedAndFormatted: null,
};

const makeColumn = (title: string, type: string): DTColumnType => ({
  title,
  data: title,
  type,
  className: '',
  columnStyles: [],
  widthHint: '',
  visible: true,
});

const dtData: DTData = {
  Columns: [
    makeColumn('name', 'string'),
    makeColumn('value', 'number'),
  ],
  Rows: [[formattedString, formattedNumber]],
};

const flatRow: FlatRow = [formattedString, formattedNumber];

const meta = (col: number) => ({ col } as CellMetaSettings);

// ---------------------------------------------------------------------------
// renderCell
// ---------------------------------------------------------------------------
describe('renderCell', () => {
  it('returns null when type is undefined (DataTables type-detection probe)', () => {
    expect(renderCell(dtData, null, undefined, flatRow, meta(0))).toBeNull();
  });

  it('returns null when column index is out of bounds', () => {
    expect(renderCell(dtData, null, 'display', flatRow, meta(99))).toBeNull();
  });

  it('returns valueRaw for type=sort (DataTables sorts on the raw value)', () => {
    expect(renderCell(dtData, null, 'sort', flatRow, meta(1))).toBe(42);
  });

  it('returns valueFormatted for type=filter (WYSIWYG: filter against what user sees)', () => {
    expect(renderCell(dtData, null, 'filter', flatRow, meta(1))).toBe('42.00');
  });

  it('returns valueFormatted for type=display', () => {
    expect(renderCell(dtData, null, 'display', flatRow, meta(1))).toBe('42.00');
  });

  it('returns the whole FormattedColumnValue object for type=type', () => {
    expect(renderCell(dtData, null, 'type', flatRow, meta(1))).toBe(formattedNumber);
  });

  it('returns raw cell value when it is a plain number (rowNumber column)', () => {
    const rowWithNumber = [7, formattedNumber];
    expect(renderCell(dtData, null, 'display', rowWithNumber, meta(0))).toBe(7);
  });

  it('returns valueFormatted for type=display on a string column', () => {
    expect(renderCell(dtData, null, 'display', flatRow, meta(0))).toBe('alpha');
  });

  // Shared fixture: null rawValue — valueFormatted='' is falsy (regression guard).
  const rowWithNull = [nullCell, formattedNumber];

  it('returns "" for type=display when valueFormatted is empty (null rawValue)', () => {
    expect(renderCell(dtData, null, 'display', rowWithNull, meta(0))).toBe('');
  });

  it('returns null valueRaw for type=sort when valueFormatted is empty (null rawValue)', () => {
    expect(renderCell(dtData, null, 'sort', rowWithNull, meta(0))).toBeNull();
  });

  it('returns "" for type=filter when valueFormatted is empty (null rawValue)', () => {
    expect(renderCell(dtData, null, 'filter', rowWithNull, meta(0))).toBe('');
  });
});

// ---------------------------------------------------------------------------
// applyCreatedCell — shared setup
// ---------------------------------------------------------------------------

// Assign jQuery as global $ for all applyCreatedCell tests.
// applyCreatedCell calls $(cell).css(...) unconditionally on entry;
// without this assignment the function throws "$ is not defined".
beforeAll(() => {
  // @ts-expect-error — global $ set for DataTables callbacks
  global.$ = $;
});

function makeCtx(overrides: Partial<CreatedCellContext> = {}): CreatedCellContext {
  return {
    dtData: { Columns: [], Rows: [] },
    rowNumbersEnabled: false,
    fontSizePercent: '100%',
    timeRange: {} as unknown as TimeRange,
    replaceVariables: (s: string) => s,
    ...overrides,
  };
}

function makeStylelessColumn(): DTColumnType {
  return {
    title: 'v',
    data: 'v',
    type: 'number',
    className: '',
    columnStyles: [],
    widthHint: '',
    visible: true,
  };
}

// ---------------------------------------------------------------------------
// applyCreatedCell — pure-logic early-return paths
// ---------------------------------------------------------------------------
describe('applyCreatedCell — early-return paths', () => {
  it('applies font-size even when column has no styles', () => {
    const col = makeStylelessColumn();
    const ctx = makeCtx({ dtData: { Columns: [col], Rows: [[]] } });
    const cell = document.createElement('td');
    applyCreatedCell(ctx, cell, null, [], 0, 0);
    expect(cell.style.fontSize).toBe('100%');
  });

  it('does not set color/bgColor when column has no styles', () => {
    const col = makeStylelessColumn();
    const ctx = makeCtx({ dtData: { Columns: [col], Rows: [[]] } });
    const cell = document.createElement('td');
    applyCreatedCell(ctx, cell, null, [], 0, 0);
    expect(cell.style.color).toBe('');
    expect(cell.style.backgroundColor).toBe('');
  });

  it('returns early when colIndex is out of bounds', () => {
    const ctx = makeCtx({ dtData: { Columns: [], Rows: [] } });
    const cell = document.createElement('td');
    // No throw and no crash — dtData.Columns[99] is undefined → early return
    expect(() => applyCreatedCell(ctx, cell, null, [], 0, 99)).not.toThrow();
  });

  it('returns early when dtData.Rows[rowIndex] is missing', () => {
    const col = makeStylelessColumn();
    // Column has a style so we get past the first guard, but Rows is empty.
    const colWithStyle = {
      ...col,
      columnStyles: [{ activeStyle: ColumnStyles.METRIC } as unknown as ColumnStyleItemType],
    };
    const ctx = makeCtx({ dtData: { Columns: [colWithStyle], Rows: [] } });
    const cell = document.createElement('td');
    // rowIndex=0 but Rows=[] → !aRow → return
    expect(() => applyCreatedCell(ctx, cell, null, [], 0, 0)).not.toThrow();
  });

  it('returns early when cellEntry is a plain number (rowNumber column)', () => {
    const col = makeStylelessColumn();
    const colWithStyle = {
      ...col,
      columnStyles: [{ activeStyle: ColumnStyles.METRIC } as unknown as ColumnStyleItemType],
    };
    const ctx = makeCtx({
      dtData: { Columns: [colWithStyle], Rows: [[42]] },
    });
    const cell = document.createElement('td');
    cell.innerHTML = '42';
    // cellEntry is number → typeof !== 'object' → return before styling
    expect(() => applyCreatedCell(ctx, cell, null, [], 0, 0)).not.toThrow();
    expect(cell.style.color).toBe('');
  });
});

// ---------------------------------------------------------------------------
// applyCreatedCell — jQuery CSS paths
// ---------------------------------------------------------------------------
describe('applyCreatedCell — jQuery CSS paths', () => {
  function makeMetricColumn(colorMode: ColumnStyleColoring, thresholds: Threshold[]): DTColumnType {
    const style: ColumnStyleItemType = {
      activeStyle: ColumnStyles.METRIC,
      enabled: true,
      label: '',
      nameOrRegex: '',
      order: 0,
      align: ColumnAlignment.DEFAULT,
      dateStyle: {},
      hiddenStyle: {},
      metricStyle: {
        alias: '',
        thresholds,
        colors: [],
        colorMode,
        decimals: '2',
        scaledDecimals: null,
        unitFormat: 'short',
        ignoreNullValues: false,
      },
      stringStyle: {
        clickThrough: '',
        clickThroughSanitize: false,
        clickThroughOpenNewTab: false,
        clickThroughCustomTargetEnabled: false,
        clickThroughCustomTarget: '',
        splitByPattern: '',
      },
    };
    return {
      title: 'value',
      data: 'value',
      type: 'number',
      className: '',
      columnStyles: [style],
      widthHint: '',
      visible: true,
    };
  }

  const threshold: Threshold[] = [{ value: 0, color: 'red', state: 0 }];
  const cellValue: FormattedColumnValue = {
    valueRaw: 50,
    valueFormatted: '50',
    valueRounded: 50,
    valueRoundedAndFormatted: '50',
  };

  it('always applies font-size from ctx.fontSizePercent', () => {
    const col = makeStylelessColumn();
    const ctx = makeCtx({
      fontSizePercent: '120%',
      dtData: { Columns: [col], Rows: [[]] },
    });
    const cell = document.createElement('td');
    applyCreatedCell(ctx, cell, null, [], 0, 0);
    expect(cell.style.fontSize).toBe('120%');
  });

  it('applies text-align:center to colIndex=0 when rowNumbersEnabled', () => {
    const col = makeStylelessColumn();
    const ctx = makeCtx({
      rowNumbersEnabled: true,
      dtData: { Columns: [col], Rows: [[]] },
    });
    const cell = document.createElement('td');
    applyCreatedCell(ctx, cell, null, [], 0, 0);
    expect(cell.style.textAlign).toBe('center');
  });

  it('does not apply text-align:center to colIndex=0 when rowNumbersEnabled is false', () => {
    const col = makeStylelessColumn();
    const ctx = makeCtx({
      rowNumbersEnabled: false,
      dtData: { Columns: [col], Rows: [[]] },
    });
    const cell = document.createElement('td');
    applyCreatedCell(ctx, cell, null, [], 0, 0);
    expect(cell.style.textAlign).toBe('');
  });

  it('METRIC Cell mode — applies threshold color and bgColor to cell', () => {
    const col = makeMetricColumn(ColumnStyleColoring.Cell, threshold);
    const ctx = makeCtx({
      dtData: { Columns: [col], Rows: [[cellValue]] },
    });
    const cell = document.createElement('td');
    cell.innerHTML = '50';
    applyCreatedCell(ctx, cell, null, [], 0, 0);
    // getCellColors with value=50 and threshold at 0 → color=white, bgColor=red
    expect(cell.style.color).toBe('white');
    expect(cell.style.backgroundColor).toBe('red');
  });

  it('METRIC Value mode — applies text color only, no bgColor', () => {
    const col = makeMetricColumn(ColumnStyleColoring.Value, threshold);
    const ctx = makeCtx({
      dtData: { Columns: [col], Rows: [[cellValue]] },
    });
    const cell = document.createElement('td');
    cell.innerHTML = '50';
    applyCreatedCell(ctx, cell, null, [], 0, 0);
    expect(cell.style.color).toBe('red');
    expect(cell.style.backgroundColor).toBe('');
  });

  it('alignment override is applied when style sets a non-default alignment', () => {
    const col = makeMetricColumn(ColumnStyleColoring.Cell, threshold);
    col.columnStyles[0].align = ColumnAlignment.RIGHT;
    const ctx = makeCtx({
      dtData: { Columns: [col], Rows: [[cellValue]] },
    });
    const cell = document.createElement('td');
    cell.innerHTML = '50';
    applyCreatedCell(ctx, cell, null, [], 0, 0);
    expect(cell.style.textAlign).toBe('right');
  });
});
