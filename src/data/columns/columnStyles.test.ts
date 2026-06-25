/**
 * Tests for Column Styling
 */

import { ColumnStyleItemType, ColumnStyles, DateFormats, DTColumnType } from 'types';
import { ApplyColumnStyles, clearColumnStyleRegexCache } from './columnStyles';

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

    it('treats nameOrRegex without slashes as exact string match, not regex', () => {
      // 'web' would regex-match 'web-01' — but without slashes it's an
      // exact string equality check, so 'web-01' does NOT match 'web'.
      const cols = makeCols(['web', 'web-01']);
      const style = makeStyle('web');
      ApplyColumnStyles(cols, [style]);
      expect(cols[0].columnStyles).toHaveLength(1);
      expect(cols[1].columnStyles).toHaveLength(0);
    });

    describe('regex cache', () => {
      beforeEach(() => clearColumnStyleRegexCache());

      it('clears and recompiles when cache exceeds REGEX_CACHE_MAX (256)', () => {
        // Fill the cache to the limit with unique patterns, then add one more
        // to trigger the clear. The new pattern must still match correctly.
        const overflowStyles = Array.from({ length: 257 }, (_, i) =>
          ({ nameOrRegex: `/^pattern-${i}-/` } as unknown as ColumnStyleItemType),
        );
        const triggerCol = [{ title: `pattern-256-x`, columnStyles: [], data: '', type: 'string', className: '', visible: true } as DTColumnType];
        ApplyColumnStyles(triggerCol, overflowStyles);
        expect(triggerCol[0].columnStyles).toHaveLength(1);
      });
    });

    describe('performance', () => {
      it('benchmark: pre-compiled regex faster than per-iteration new RegExp (full scan, no matches)', () => {
        // Use columns that match no style so every call scans all styles —
        // this is the worst case that maximises regex-construction savings.
        const N = 5_000;
        const titles = Array.from({ length: 50 }, (_, i) => `other-${i}`);
        const styles = [
          makeStyle('/^web-/'), makeStyle('/^db-/'), makeStyle('exact'),
          makeStyle('/^api-/'), makeStyle('/^cache-/'), makeStyle('/^queue-/'),
          makeStyle('/^worker-/'), makeStyle('/^proxy-/'),
        ];

        // Original approach: new RegExp inside the loop per column×style
        const t0 = performance.now();
        for (let iter = 0; iter < N; iter++) {
          const cols = makeCols(titles);
          for (const item of cols) {
            for (const s of styles) {
              const expr = `${s.nameOrRegex}`;
              if (expr.startsWith('/') && expr.endsWith('/')) {
                const rx = new RegExp(expr.slice(1, -1));
                if (item.title.match(rx)) { item.columnStyles.push(s); break; }
              } else {
                if (item.title === expr) { item.columnStyles.push(s); break; }
              }
            }
          }
        }
        const original = performance.now() - t0;

        // Optimized: pre-compile all regexes once per ApplyColumnStyles call
        const t1 = performance.now();
        for (let iter = 0; iter < N; iter++) {
          const cols = makeCols(titles);
          ApplyColumnStyles(cols, styles);
        }
        const optimized = performance.now() - t1;

        console.log(`ApplyColumnStyles benchmark — original: ${original.toFixed(1)}ms  optimized: ${optimized.toFixed(1)}ms  speedup: ${(original / optimized).toFixed(2)}x`);
        // Guard only when speedup is clear — thin margins can be noise in CI.
        if (original > 10) {
          expect(optimized).toBeLessThan(original);
        }
      });
    });
  });
});
