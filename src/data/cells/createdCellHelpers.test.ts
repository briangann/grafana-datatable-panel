import $ from 'jquery';
import { processRowStyle, ProcessStringValueStyle } from './createdCellHelpers';
import {
  ColumnAlignment,
  ColumnStyleColoring,
  ColumnStyleItemType,
  ColumnStyles,
  DTColumnType,
  DTData,
  FlatRow,
  FormattedColumnValue,
  RowColorEntry,
  Threshold,
} from 'types';
import { TimeRange, dateTime } from '@grafana/data';

beforeAll(() => {
  // @ts-expect-error — global $ required by processRowStyle
  global.$ = $;
});

// ---------------------------------------------------------------------------
// processRowStyle — row color cache
// ---------------------------------------------------------------------------

function makeMetricRowColumn(thresholds: Threshold[]): DTColumnType {
  return {
    title: 'status',
    data: 'status',
    type: 'number',
    className: '',
    columnStyles: [{
      activeStyle: ColumnStyles.METRIC,
      enabled: true,
      label: '',
      nameOrRegex: 'status',
      order: 0,
      align: ColumnAlignment.DEFAULT,
      dateStyle: {},
      hiddenStyle: {},
      metricStyle: {
        alias: '',
        thresholds,
        colors: [],
        colorMode: ColumnStyleColoring.Row,
        decimals: '0',
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
    } as unknown as ColumnStyleItemType],
    widthHint: '',
    visible: true,
  };
}

function makeNoStyleColumn(name: string): DTColumnType {
  return { title: name, data: name, type: 'string', className: '', columnStyles: [], widthHint: '', visible: true };
}

const redThreshold: Threshold[] = [{ value: 0, color: '#f53636', state: 2 }];

describe('processRowStyle — row color cache', () => {
  it('populates cache entry with bg/fg when a METRIC column threshold matches', () => {
    // Column layout: [noStyle(0), status(1)] — status at columnNumber=1
    const statusCol = makeMetricRowColumn(redThreshold);
    const noStyleCol = makeNoStyleColumn('org');
    const statusValue: FormattedColumnValue = { valueRaw: 50, valueFormatted: '50', valueRounded: 50, valueRoundedAndFormatted: '50' };
    const flatRow: FlatRow = [
      { valueRaw: 'SpaceX', valueFormatted: 'SpaceX', valueRounded: null, valueRoundedAndFormatted: null },
      statusValue,
    ];
    const dtData: DTData = { Columns: [noStyleCol, statusCol], Rows: [flatRow] };
    const cache = new Map<number, RowColorEntry>();

    const tr = document.createElement('tr');
    const cell = document.createElement('td');
    tr.appendChild(cell);

    processRowStyle(cell, flatRow, dtData, cache, 0);

    const entry = cache.get(0);
    expect(entry).toBeDefined();
    expect(entry?.bg).toBe('#f53636');
    expect(entry?.fg).toBe('white');
  });

  it('does NOT populate cache when no METRIC columns have a threshold match', () => {
    const noStyleCol = makeNoStyleColumn('org');
    const flatRow: FlatRow = [{ valueRaw: 'SpaceX', valueFormatted: 'SpaceX', valueRounded: null, valueRoundedAndFormatted: null }];
    const dtData: DTData = { Columns: [noStyleCol], Rows: [flatRow] };
    const cache = new Map<number, RowColorEntry>();
    const tr = document.createElement('tr');
    const cell = document.createElement('td');
    tr.appendChild(cell);

    processRowStyle(cell, flatRow, dtData, cache, 0);

    expect(cache.get(0)).toBeUndefined();
  });

  it('colors existing sibling cells (those already in the tr) immediately', () => {
    const statusCol = makeMetricRowColumn(redThreshold);
    const statusValue: FormattedColumnValue = { valueRaw: 50, valueFormatted: '50', valueRounded: 50, valueRoundedAndFormatted: '50' };
    const flatRow: FlatRow = [statusValue];
    const dtData: DTData = { Columns: [statusCol], Rows: [flatRow] };
    const cache = new Map<number, RowColorEntry>();

    const tr = document.createElement('tr');
    const cell = document.createElement('td');
    const siblingCell = document.createElement('td');
    tr.appendChild(siblingCell);
    tr.appendChild(cell);

    processRowStyle(cell, flatRow, dtData, cache, 0);

    // siblingCell was in the tr before processRowStyle ran — must be colored
    expect(siblingCell.style.backgroundColor).not.toBe('');
  });
});

// ---------------------------------------------------------------------------
// ProcessStringValueStyle
// ---------------------------------------------------------------------------

// Covers the plumbing that forwards `replaceVariables` from BuildColumnDefs
// down into ProcessClickthrough. The actual substitution logic is unit-tested
// in cellRenderer.test.ts — these tests pin the forwarding so a future
// refactor that drops the parameter or swaps its position is caught here.
describe('ProcessStringValueStyle', () => {
  const fakeTimeRange = {
    from: dateTime(0),
    to: dateTime(0),
    raw: { from: 'now-1h', to: 'now' },
  } as unknown as TimeRange;

  const processedItem = { valueFormatted: 'cellText' } as FormattedColumnValue;

  const makeStyle = (clickThrough: string): ColumnStyleItemType =>
    ({
      stringStyle: {
        clickThrough,
        clickThroughOpenNewTab: true,
        clickThroughCustomTargetEnabled: false,
        clickThroughCustomTarget: '',
        clickThroughSanitize: false,
        splitByPattern: '',
      },
    } as unknown as ColumnStyleItemType);

  it('forwards replaceVariables to ProcessClickthrough for substitution', () => {
    const replaceVariables = (s: string) => s.replace(/\$host/g, 'web-99');
    const html = ProcessStringValueStyle(
      makeStyle('http://example.com/h/$host?cell=$__cell'),
      [],
      processedItem,
      fakeTimeRange,
      replaceVariables,
    );
    expect(html).toContain('href="http://example.com/h/web-99?cell=cellText"');
  });

  it('returns null when the column style has no clickThrough configured', () => {
    const replaceVariables = (s: string) => s;
    const html = ProcessStringValueStyle(
      makeStyle(''),
      [],
      processedItem,
      fakeTimeRange,
      replaceVariables,
    );
    expect(html).toBeNull();
  });
});
