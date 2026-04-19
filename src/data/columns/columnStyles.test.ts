/**
 * Tests for Column Styling
 */

import { ColumnStyleItemType, ColumnStyles, DateFormats } from 'types';
import { ApplyColumnStyles } from './columnStyles';
import { DTColumnType } from '../types';

describe('Column Styles', () => {
  const columns: DTColumnType[] = [
    {
      title: 'time',
      data: '123',
      type: 'time',
      className: '',
      columnStyles: [],
      visible: true,
    }
  ];
  const columnStyles: ColumnStyleItemType[] = [
    {
      label: 'Style-0',
      activeStyle: ColumnStyles.METRIC,
      enabled: true,
      nameOrRegex: 'time',
      order: 0,
      metricStyle: {
        alias: '',
        thresholds: [],
        colors: [],
        unitFormat: '',
        decimals: '',
        scaledDecimals: null,
        ignoreNullValues: true,
      },
      stringStyle: {
        clickThrough: '',
        clickThroughSanitize: true,
        clickThroughOpenNewTab: true,
        clickThroughCustomTargetEnabled: false,
        clickThroughCustomTarget: '',
        splitByPattern: '',
      },
      dateStyle: {
        dateFormat: DateFormats[5].value,
      },
      hiddenStyle: {},
    }
  ];
  describe('Applies Time style', () => {
    it('returns time style', () => {
      ApplyColumnStyles(columns, columnStyles);
      expect(columns[0].columnStyles[0]).toEqual(columnStyles[0]);
    });
  });

  describe('regex match path', () => {
    const makeCols = (titles: string[]): DTColumnType[] =>
      titles.map((title) => ({
        title,
        data: title,
        type: 'string',
        className: '',
        columnStyles: [],
        visible: true,
      } as DTColumnType));

    const makeStyle = (nameOrRegex: string): ColumnStyleItemType =>
      ({
        ...columnStyles[0],
        nameOrRegex,
      } as ColumnStyleItemType);

    it('matches columns whose title matches the regex between slashes', () => {
      const cols = makeCols(['web-01', 'db-02', 'web-09']);
      const style = makeStyle('/^web-/');
      ApplyColumnStyles(cols, [style]);
      expect(cols[0].columnStyles).toHaveLength(1);
      expect(cols[1].columnStyles).toHaveLength(0);
      expect(cols[2].columnStyles).toHaveLength(1);
    });

    it('does not match when the regex has no hit', () => {
      const cols = makeCols(['A', 'B']);
      const style = makeStyle('/^X/');
      ApplyColumnStyles(cols, [style]);
      expect(cols[0].columnStyles).toHaveLength(0);
      expect(cols[1].columnStyles).toHaveLength(0);
    });

    it('stops at the first style match per column (break after push)', () => {
      const cols = makeCols(['web-01']);
      const first = makeStyle('/^web-/');
      const second = { ...makeStyle('/^web-/'), label: 'Second' } as ColumnStyleItemType;
      ApplyColumnStyles(cols, [first, second]);
      expect(cols[0].columnStyles).toHaveLength(1);
      expect(cols[0].columnStyles[0]).toBe(first);
    });

    it('treats unslashed nameOrRegex as exact string match, not regex', () => {
      // 'web' would regex-match 'web-01' — but without slashes it's an
      // exact string equality check, so 'web-01' does NOT match 'web'.
      const cols = makeCols(['web', 'web-01']);
      const style = makeStyle('web');
      ApplyColumnStyles(cols, [style]);
      expect(cols[0].columnStyles).toHaveLength(1);
      expect(cols[1].columnStyles).toHaveLength(0);
    });
  });
});
