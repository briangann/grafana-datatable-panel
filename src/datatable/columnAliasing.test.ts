import { ApplyColumnAliases } from './columnAliasing';
import { DTColumnType } from './types';

const col = (title: string): DTColumnType =>
  ({
    title,
    data: title,
    type: 'string',
    className: '',
    columnStyles: [],
    visible: true,
  } as DTColumnType);

describe('ApplyColumnAliases', () => {
  it('leaves column titles unchanged when no aliases are configured', () => {
    const cols = [col('time'), col('A-series')];
    const result = ApplyColumnAliases(cols, []);
    expect(result.map((c) => c.title)).toEqual(['time', 'A-series']);
  });

  it('renames a matching column title to its alias', () => {
    const cols = [col('A-series'), col('B-series')];
    ApplyColumnAliases(cols, [{ name: 'A-series', alias: 'Alpha' }]);
    expect(cols.map((c) => c.title)).toEqual(['Alpha', 'B-series']);
  });

  it('leaves untouched columns unchanged when only some match', () => {
    const cols = [col('A'), col('B'), col('C')];
    ApplyColumnAliases(cols, [{ name: 'B', alias: 'Bravo' }]);
    expect(cols.map((c) => c.title)).toEqual(['A', 'Bravo', 'C']);
  });

  it('uses the first alias when the same name appears twice', () => {
    const cols = [col('host')];
    ApplyColumnAliases(cols, [
      { name: 'host', alias: 'Host1' },
      { name: 'host', alias: 'Host2' },
    ]);
    expect(cols[0].title).toBe('Host1');
  });

  it('mutates the input array in place and returns the same reference', () => {
    const cols = [col('x')];
    const result = ApplyColumnAliases(cols, [{ name: 'x', alias: 'X!' }]);
    expect(result).toBe(cols);
    expect(cols[0].title).toBe('X!');
  });

  it('tolerates an empty columns array', () => {
    expect(ApplyColumnAliases([], [{ name: 'a', alias: 'A' }])).toEqual([]);
  });

  it('skips aliases with empty string values (falls back to original title)', () => {
    // `if (anAlias)` rejects '' — original title preserved.
    const cols = [col('time')];
    ApplyColumnAliases(cols, [{ name: 'time', alias: '' }]);
    expect(cols[0].title).toBe('time');
  });
});
