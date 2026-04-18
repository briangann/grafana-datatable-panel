import { getColumnClassName } from './dataHelpers';

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
