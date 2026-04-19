import { ApplyColumnWidthHints } from './columnWidthHints';
import { DTColumnType } from '../types';

const col = (title: string): DTColumnType =>
  ({
    title,
    data: title,
    type: 'string',
    className: '',
    columnStyles: [],
    visible: true,
  } as DTColumnType);

describe('ApplyColumnWidthHints', () => {
  it('leaves widthHint unset when no hints are configured', () => {
    const cols = [col('time'), col('A')];
    ApplyColumnWidthHints(cols, []);
    expect(cols.map((c) => c.widthHint)).toEqual([undefined, undefined]);
  });

  it('stamps the configured width on a matching column', () => {
    const cols = [col('time')];
    ApplyColumnWidthHints(cols, [{ name: 'time', width: '180px' }]);
    expect(cols[0].widthHint).toBe('180px');
  });

  it('applies hints only to matching columns', () => {
    const cols = [col('A'), col('B'), col('C')];
    ApplyColumnWidthHints(cols, [
      { name: 'A', width: '100px' },
      { name: 'C', width: '300px' },
    ]);
    expect(cols.map((c) => c.widthHint)).toEqual(['100px', undefined, '300px']);
  });

  it('returns the first matching hint when the same name appears twice', () => {
    const cols = [col('value')];
    ApplyColumnWidthHints(cols, [
      { name: 'value', width: '120px' },
      { name: 'value', width: '240px' },
    ]);
    expect(cols[0].widthHint).toBe('120px');
  });

  it('mutates the input array in place and returns the same reference', () => {
    const cols = [col('x')];
    const result = ApplyColumnWidthHints(cols, [{ name: 'x', width: '50px' }]);
    expect(result).toBe(cols);
    expect(cols[0].widthHint).toBe('50px');
  });

  it('tolerates an empty columns array', () => {
    expect(ApplyColumnWidthHints([], [{ name: 'a', width: '1px' }])).toEqual([]);
  });

  it('skips hints with empty width strings (no mutation)', () => {
    // `if (aHint)` rejects '' — widthHint stays untouched.
    const cols = [col('time')];
    ApplyColumnWidthHints(cols, [{ name: 'time', width: '' }]);
    expect(cols[0].widthHint).toBeUndefined();
  });
});
