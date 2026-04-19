import { ProcessStringValueStyle } from './createdCellHelpers';
import { ColumnStyleItemType } from 'types';
import { FormattedColumnValue } from '../types';
import { TimeRange, dateTime } from '@grafana/data';

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
      [],
      0,
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
      [],
      0,
      processedItem,
      fakeTimeRange,
      replaceVariables,
    );
    expect(html).toBeNull();
  });
});
