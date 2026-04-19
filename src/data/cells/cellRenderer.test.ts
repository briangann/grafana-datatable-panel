/**
 * Tests for Rendering a Cell
 */
import { ColumnStyleItemType, ColumnStyles, DateFormats, FormattedColumnValue } from 'types';
import {
  applyFormat,
  FormatColumnValue,
  ProcessClickthrough,
  ReplaceCellMacros,
  ReplaceCellSplitByPattern,
  ReplaceTimeMacros,
  resolveClickThroughTarget,
  TimeFormatter,
} from './cellRenderer';
import { Field, FieldConfig, FieldType, GrafanaTheme2, TimeRange, dateTime} from '@grafana/data';
// Single reference epoch reused across FormatColumnValue / TimeFormatter
// cases so the human-readable date is declared once at the top of the file
// instead of inferred from each assertion's `.toBe('2025-04-12 …')`.
const EPOCH_2025_04_12T19_27_35Z = 1744486055000;

describe('Cell Renderer', () => {
  const theme2 = {} as unknown as GrafanaTheme2;
  describe('Test FormatColumnValue', () => {
    describe('with time column', () => {
      const aField: Field = {
        name: '',
        type: FieldType.time,
        config: [] as FieldConfig,
        values: [0]
      };
      it('returns valid formatted time', () => {
        const result = FormatColumnValue(
          'utc',
          null,
          aField,
          1,
          0,
          EPOCH_2025_04_12T19_27_35Z,
          'time',
          theme2,
        );
        expect(result.valueFormatted).toEqual('2025-04-12T19:27:35+00:00');
      });
    });

    describe('with an other type column', () => {
      const aField: Field = {
        name: '',
        type: FieldType.other,
        config: {
          unit: 'kwh',
          decimals: 3,
        } as FieldConfig,
        values: []
      };
      it('returns formatted value', () => {
        const result = FormatColumnValue(
          'utc',
          null,
          aField,
          1,
          0,
          123.456,
          'other',
          theme2,
        );
        // show just return a string with the value inside
        expect(result.valueFormatted).toEqual('123.456');
      });
    });

    describe('with a string column', () => {
      const aField: Field = {
        name: '',
        type: FieldType.string,
        config: [] as FieldConfig,
        values: [],
      };
      it('passes the string value through unchanged', () => {
        const result = FormatColumnValue('utc', null, aField, 0, 0, 'hello', 'string', {} as GrafanaTheme2);
        expect(result).toEqual({
          valueRaw: 'hello',
          valueFormatted: 'hello',
          valueRounded: null,
          valueRoundedAndFormatted: null,
        });
      });
    });

    describe('with a DATE columnStyle and custom dateFormat', () => {
      const aField: Field = {
        name: '',
        type: FieldType.time,
        config: [] as FieldConfig,
        values: [],
      };
      const dateStyle = {
        activeStyle: ColumnStyles.DATE,
        dateStyle: { dateFormat: 'YYYY/MM/DD' },
      } as unknown as ColumnStyleItemType;
      it('uses the columnStyle date format when present', () => {
        const result = FormatColumnValue('utc', dateStyle, aField, 0, 0, EPOCH_2025_04_12T19_27_35Z, 'time', {} as GrafanaTheme2);
        expect(result.valueFormatted).toBe('2025/04/12');
      });
    });

    describe('with columnStyle metric overrides', () => {
      const aField: Field = {
        name: '',
        type: FieldType.number,
        config: { unit: 'kwh', decimals: 3 } as FieldConfig,
        values: [],
      };
      const metricStyle = {
        activeStyle: ColumnStyles.METRIC,
        metricStyle: { unitFormat: 'percentunit', decimals: '1' },
      } as unknown as ColumnStyleItemType;

      it('columnStyle unit/decimals override the field config', () => {
        const result = FormatColumnValue('utc', metricStyle, aField, 0, 0, 0.5, 'number', {} as GrafanaTheme2);
        // percentunit 0.5 at 1 decimal → "50.0%"
        expect(result.valueFormatted).toBe('50.0%');
      });
    });

    describe('with a numeric column', () => {
      const aField: Field = {
        name: '',
        type: FieldType.number,
        config: {
          unit: 'kwh',
          decimals: 3,
        } as FieldConfig,
        values: []
      };
      it('returns formatted value', () => {
        const result = FormatColumnValue(
          'utc',
          null,
          aField,
          1,
          0,
          123.456,
          'number',
          theme2,
        );
        expect(result.valueFormatted).toEqual('123.456 kwh');
      });
    });
  });

  describe('Test TimeFormatter', () => {
    describe('Test numeric to UTC formatting', () => {
      const result = TimeFormatter('utc', EPOCH_2025_04_12T19_27_35Z, DateFormats[5].value);
      expect(result.valueFormatted).toEqual('2025-04-12T19:27:35+00:00');
    });
    describe('Test numeric to America/Denver formatting', () => {
      const result = TimeFormatter('America/Denver', EPOCH_2025_04_12T19_27_35Z, 'YYYY-MM-DDTHH:mm:ssZ');
      expect(result.valueFormatted).toEqual('2025-04-12T13:27:35-06:00');
    });
  });

  describe('Test ReplaceTimeMacros', () => {
    describe('Test replace $__from', () => {
      let content = 'content with $__from';
      const timeRange = getDefaultTimeRange();
      const result = ReplaceTimeMacros(timeRange, content);
      expect(result).toEqual('content with now-15m');
    });
    describe('Test replace $__to', () => {
      let content = 'content with $__to';
      const timeRange = getDefaultTimeRange();
      const result = ReplaceTimeMacros(timeRange, content);
      expect(result).toEqual('content with now');
    });
    describe('Test replace $__keepTime', () => {
      let content = 'content with $__keepTime';
      const timeRange = getDefaultTimeRange();
      const result = ReplaceTimeMacros(timeRange, content);
      expect(result).toEqual('content with from=now-15m&to=now');
    });
  });

  describe('Test ProcessMacroForClickthrough', () => {
    describe('Test replace $__cell_N', () => {
    });
  });

  describe('Test ApplyUnitsAndDecimals', () => {
    describe('Test replace $__cell_N', () => {
    });
  });


  describe('Test applyFormat', () => {
    describe('Test with kwh units', () => {
      const result = applyFormat(123.456, 2, 'kwh');
      expect(result.valueFormatted).toEqual('123.46 kwh');
      expect(result.valueRounded).toEqual(123.46);
      expect(result.valueRoundedAndFormatted).toEqual('123.46 kwh');
    });

    it('prepends the prefix for currency formats', () => {
      // currencyUSD has a '$' prefix — exercises the `formatted.prefix`
      // branch that concatenates before the value.
      const result = applyFormat(12.34, 2, 'currencyUSD');
      expect(result.valueFormatted.startsWith('$')).toBe(true);
      expect(result.valueFormatted).toContain('12.34');
    });
  });

  describe('ProcessClickthrough — URL reconstruction (issue #276)', () => {
    // Minimal stringStyle fixture that exercises the URL-rebuild code path
    // without triggering macro replacement or sanitization.
    const baseStringStyle = {
      clickThrough: '',
      clickThroughOpenNewTab: true,
      clickThroughCustomTargetEnabled: false,
      clickThroughCustomTarget: '',
      clickThroughSanitize: false,
      splitByPattern: '',
    };

    const fakeTimeRange = {
      from: dateTime(0),
      to: dateTime(0),
      raw: { from: 'now-1h', to: 'now' },
    } as unknown as TimeRange;

    const processedItem = { valueFormatted: 'cellText' } as FormattedColumnValue;

    const noopReplaceVariables = (s: string) => s;

    const run = (clickThrough: string, replaceVariables: (s: string) => string = noopReplaceVariables) =>
      ProcessClickthrough(
        { stringStyle: { ...baseStringStyle, clickThrough } } as unknown as ColumnStyleItemType,
        /* columns */ [],
        /* rows */ [],
        /* rowIndex */ 0,
        processedItem,
        fakeTimeRange,
        replaceVariables,
      );

    it.each([
      {
        label: 'absolute URL preserves host:port',
        input: 'http://a.b.c:8080/path?x=1',
        expected: 'href="http://a.b.c:8080/path?x=1"',
      },
      {
        label: 'relative URL preserves path + query',
        input: '/d/uid/slug?var=x',
        expected: 'href="/d/uid/slug?var=x"',
      },
      {
        label: 'absolute URL with no query omits trailing ?',
        input: 'http://a.b.c/path',
        expected: 'href="http://a.b.c/path"',
      },
      {
        label: 'absolute URL preserves fragment',
        input: 'http://a.b.c/d#panel-2',
        expected: 'href="http://a.b.c/d#panel-2"',
      },
      {
        label: 'non-HTTP scheme is emitted verbatim',
        input: 'mailto:ops@example.com',
        expected: 'href="mailto:ops@example.com"',
      },
      {
        label: 'protocol-relative URL is emitted verbatim',
        input: '//host.example/path',
        expected: 'href="//host.example/path"',
      },
    ])('$label', ({ input, expected }) => {
      const html = run(input);
      expect(html).toContain(expected);
    });

    it('substitutes dashboard variables after plugin macros', () => {
      const replaceVariables = (s: string) => s.replace(/\$host/g, 'web-01');
      const html = run('http://example.com/h/$host?cell=$__cell', replaceVariables);
      expect(html).toContain('href="http://example.com/h/web-01?cell=cellText"');
    });

    it('guard skips replaceVariables when no template markers remain', () => {
      const calls: string[] = [];
      const replaceVariables = (s: string) => {
        calls.push(s);
        return s;
      };
      run('http://example.com/plain', replaceVariables);
      expect(calls).toEqual([]);
    });

    it('plugin macros take precedence over colliding dashboard variables', () => {
      // $__cell is a plugin macro — it resolves BEFORE replaceVariables sees it
      const replaceVariables = (s: string) => s.replace('$__cell', 'INTERCEPTED');
      const html = run('http://example.com/x?v=$__cell', replaceVariables);
      expect(html).toContain('href="http://example.com/x?v=cellText"');
      expect(html).not.toContain('INTERCEPTED');
    });

    it('splits the cell value by splitByPattern and expands $__pattern_N', () => {
      const style = {
        stringStyle: {
          ...baseStringStyle,
          clickThrough: 'http://example.com/?host=$__pattern_0&env=$__pattern_1',
          splitByPattern: '/\\s/',
        },
      } as unknown as ColumnStyleItemType;
      const html = ProcessClickthrough(
        style,
        [],
        [],
        0,
        { valueFormatted: 'web-01 prod' } as FormattedColumnValue,
        fakeTimeRange,
        noopReplaceVariables,
      );
      expect(html).toContain('href="http://example.com/?host=web-01&env=prod"');
    });

    it('sanitizes the URL when clickThroughSanitize is enabled', () => {
      // `textUtil.sanitizeUrl` strips known-dangerous schemes; here we
      // just assert the sanitize branch runs without throwing by
      // feeding a normal URL. Changed behaviour (scheme stripping) is
      // owned by @grafana/data and isn't re-tested at this layer.
      const style = {
        stringStyle: {
          ...baseStringStyle,
          clickThrough: 'http://example.com/x',
          clickThroughSanitize: true,
        },
      } as unknown as ColumnStyleItemType;
      const html = ProcessClickthrough(
        style,
        [],
        [],
        0,
        { valueFormatted: 'cell' } as FormattedColumnValue,
        fakeTimeRange,
        noopReplaceVariables,
      );
      expect(html).toContain('href="http://example.com/x"');
    });
  });

  describe('ReplaceTimeMacros', () => {
    const tr = {
      from: dateTime(0),
      to: dateTime(0),
      raw: { from: 'now-6h', to: 'now' },
    } as unknown as TimeRange;

    it('replaces $__from with raw.from', () => {
      expect(ReplaceTimeMacros(tr, 'http://x/?f=$__from')).toBe('http://x/?f=now-6h');
    });

    it('replaces $__to with raw.to', () => {
      expect(ReplaceTimeMacros(tr, 'http://x/?t=$__to')).toBe('http://x/?t=now');
    });

    it('replaces $__keepTime with from+to pair', () => {
      expect(ReplaceTimeMacros(tr, 'http://x/?$__keepTime')).toBe(
        'http://x/?from=now-6h&to=now',
      );
    });

    it('passes through content with no time macros unchanged', () => {
      expect(ReplaceTimeMacros(tr, 'http://x/plain')).toBe('http://x/plain');
    });
  });

  describe('ReplaceCellMacros', () => {
    const rows = [
      { valueFormatted: 'alpha' } as FormattedColumnValue,
      { valueFormatted: 'bravo' } as FormattedColumnValue,
      { valueFormatted: 'charlie' } as FormattedColumnValue,
    ];

    it('replaces $__cell with the current cell content', () => {
      expect(ReplaceCellMacros('host-$__cell', 'web-01', rows)).toBe('host-web-01');
    });

    it('respects word boundary so $__cell does not clobber $__cell_N', () => {
      // Should replace $__cell (word-boundary) but NOT the $__cell prefix
      // inside $__cell_1 — the $__cell_N branch handles that separately.
      const out = ReplaceCellMacros('a=$__cell&b=$__cell_1', 'X', rows);
      expect(out).toBe('a=X&b=bravo');
    });

    it('replaces $__cell_N with the Nth row', () => {
      expect(ReplaceCellMacros('row=$__cell_2', 'current', rows)).toBe('row=charlie');
    });

    it('skips out-of-bounds $__cell_N references', () => {
      expect(ReplaceCellMacros('row=$__cell_99', 'current', rows)).toBe('row=$__cell_99');
    });

    it('returns the input untouched when no macros are present', () => {
      expect(ReplaceCellMacros('http://x/plain', 'X', rows)).toBe('http://x/plain');
    });
  });

  describe('ReplaceCellSplitByPattern', () => {
    const cellContent = { valueFormatted: 'web-01 prod' } as FormattedColumnValue;

    it('replaces $__pattern_N with the Nth split segment', () => {
      // Split by whitespace: ['web-01', 'prod']
      const out = ReplaceCellSplitByPattern(
        'host=$__pattern_0&env=$__pattern_1',
        cellContent,
        '/\\s/',
      );
      expect(out).toBe('host=web-01&env=prod');
    });

    it('returns the input untouched when the cell content is empty', () => {
      const empty = { valueFormatted: '' } as FormattedColumnValue;
      expect(ReplaceCellSplitByPattern('host=$__pattern_0', empty, '/\\s/')).toBe(
        'host=$__pattern_0',
      );
    });

    it('returns the input untouched when cellContent is null', () => {
      expect(
        ReplaceCellSplitByPattern(
          'host=$__pattern_0',
          null as unknown as FormattedColumnValue,
          '/\\s/',
        ),
      ).toBe('host=$__pattern_0');
    });

    it('leaves $__pattern_N untouched when N exceeds the split count', () => {
      const out = ReplaceCellSplitByPattern(
        'a=$__pattern_0&b=$__pattern_9',
        cellContent,
        '/\\s/',
      );
      expect(out).toBe('a=web-01&b=$__pattern_9');
    });
  });

  describe('resolveClickThroughTarget', () => {
    it('returns _self when neither flag is set', () => {
      expect(resolveClickThroughTarget(false, false, '')).toBe('_self');
    });

    it('returns _blank when openNewTab is true', () => {
      expect(resolveClickThroughTarget(true, false, '')).toBe('_blank');
    });

    it('returns the custom target when customTargetEnabled is true (wins over openNewTab)', () => {
      expect(resolveClickThroughTarget(true, true, 'named-window')).toBe('named-window');
    });

    it('returns the custom target value even when openNewTab is false', () => {
      expect(resolveClickThroughTarget(false, true, 'x')).toBe('x');
    });
  });

  describe('TimeFormatter', () => {
    const epoch = EPOCH_2025_04_12T19_27_35Z;

    it('formats a timestamp in UTC when timeZone is "utc"', () => {
      const result = TimeFormatter('utc', epoch, 'YYYY-MM-DD HH:mm:ss');
      expect(result.valueRaw).toBe(epoch);
      expect(result.valueFormatted).toBe('2025-04-12 19:27:35');
      expect(result.valueRoundedAndFormatted).toBe(result.valueFormatted);
      expect(result.valueRounded).toBeNull();
    });

    it('converts the timestamp to the named zone (UTC-4 EDT in April)', () => {
      const result = TimeFormatter('America/New_York', epoch, 'YYYY-MM-DD HH:mm:ss');
      expect(result.valueRaw).toBe(epoch);
      expect(result.valueFormatted).toBe('2025-04-12 15:27:35');
      expect(result.valueRoundedAndFormatted).toBe(result.valueFormatted);
    });

    it('resolves "browser" to the host system zone', () => {
      // Can only assert shape here — the CI runner's zone is not pinned.
      const result = TimeFormatter('browser', epoch, 'YYYY-MM-DD HH:mm:ss');
      expect(result.valueRaw).toBe(epoch);
      expect(result.valueFormatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
  });
});

function getDefaultTimeRange(): TimeRange {
  const fromDateTime = dateTime().subtract(15, 'minutes');
  const toDateTime = dateTime();
  return {
    from: fromDateTime,
    to: toDateTime,
    raw: { from: 'now-15m', to: 'now' },
  };
}
