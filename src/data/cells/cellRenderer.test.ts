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
import { Field, FieldConfig, FieldType, TimeRange, dateTime} from '@grafana/data';
// Single reference epoch reused across FormatColumnValue / TimeFormatter
// cases so the human-readable date is declared once at the top of the file
// instead of inferred from each assertion's `.toBe('2025-04-12 …')`.
const EPOCH_2025_04_12T19_27_35Z = 1744486055000;

describe('Cell Renderer', () => {
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
          EPOCH_2025_04_12T19_27_35Z,
          'time',
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
          123.456,
          'other',
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
        const result = FormatColumnValue('utc', null, aField, 'hello', 'string');
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
        const result = FormatColumnValue('utc', dateStyle, aField, EPOCH_2025_04_12T19_27_35Z, 'time');
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
        const result = FormatColumnValue('utc', metricStyle, aField, 0.5, 'number');
        // percentunit 0.5 at 1 decimal → "50.0%"
        expect(result.valueFormatted).toBe('50.0%');
      });
      it('respects decimals: 0 — numeric zero must not be treated as falsy', () => {
        // `if (columnStyle && columnStyle.metricStyle.decimals)` is a falsy check.
        // String '0' is truthy so the panel editor path works, but numeric 0
        // (set by migrations or programmatic construction) is falsy — the
        // condition fails and maxDecimals falls back to field.config.decimals (3).
        // The field-config path uses !== undefined/null; this path is inconsistent.
        const zeroDecimals = {
          activeStyle: ColumnStyles.METRIC,
          metricStyle: { unitFormat: 'kwh', decimals: 0 }, // numeric 0, not string '0'
        } as unknown as ColumnStyleItemType;
        const result = FormatColumnValue('utc', zeroDecimals, aField, 123.456, 'number');
        // With 0 decimals: '123 kwh'
        // Bug (numeric 0 is falsy → falls back to field.config.decimals=3): '123.456 kwh'
        expect(result.valueFormatted).toBe('123 kwh');
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
          123.456,
          'number',
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
    it('valueRounded is 0 when the value rounds to zero — not the original (fixes || vs ?? bug)', () => {
      // Before fix: roundValue(0.001, 0) returns 0, then `0 || value` = 0.001 (original).
      // A rounded-to-zero result was indistinguishable from null, so the original
      // value leaked into valueRounded/valueRoundedAndFormatted. ?? fixes this.
      // Use 'none' (no suffix) so valueRoundedAndFormatted stays numeric — 'short'
      // could add a suffix on a Grafana version bump, turning 0 into '0' and
      // breaking the type-strict toBe(0) assertion.
      const result = applyFormat(0.001, 0, 'none');
      expect(result.valueRounded).toBe(0);
      expect(result.valueRoundedAndFormatted).toBe(0);
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
        /* rows */ [],
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
        { valueFormatted: 'web-01 prod' } as FormattedColumnValue,
        fakeTimeRange,
        noopReplaceVariables,
      );
      expect(html).toContain('href="http://example.com/?host=web-01&env=prod"');
    });

    it('sanitizes the URL when clickThroughSanitize is enabled', () => {
      // `textUtil.sanitizeUrl` strips known-dangerous schemes; here we
      // just assert the sanitize branch runs without throwing by
      // feeding a normal URL. Changed behavior (scheme stripping) is
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
        { valueFormatted: 'cell' } as FormattedColumnValue,
        fakeTimeRange,
        noopReplaceVariables,
      );
      expect(html).toContain('href="http://example.com/x"');
    });

    it('resolves $__pattern_N and multiple $__cell_N in a single URL without URL-encoding them (issue #324)', () => {
      // Reproduces the exact scenario from issue #324:
      //   URL template:  https://host/d/$__pattern_0_$__pattern_1/?var-Job=$__cell_5&var-Host=$__cell_4&from=$__cell_0
      //   splitByPattern: /_/  →  cell 'goldenkpis_ipmplscore_ipmplscore' splits to
      //                          ['goldenkpis', 'ipmplscore', 'ipmplscore']
      //   rows[0] = '2026-06-02', rows[4] = 'GC8801-LER03', rows[5] = 'goldenkpis_ipmplscore_ipmplscore'
      //
      // Broken behaviour (pre-fix): only the first $__cell_N match was substituted
      // (non-global regex), leaving $__cell_4 and $__cell_0 as literals that
      // new URL() then percent-encoded to %24__cell_4 / %24__cell_0.
      const rows6 = [
        { valueFormatted: '2026-06-02' } as FormattedColumnValue,
        { valueFormatted: 'r1' } as FormattedColumnValue,
        { valueFormatted: 'r2' } as FormattedColumnValue,
        { valueFormatted: 'r3' } as FormattedColumnValue,
        { valueFormatted: 'GC8801-LER03' } as FormattedColumnValue,
        { valueFormatted: 'goldenkpis_ipmplscore_ipmplscore' } as FormattedColumnValue,
      ];
      const style = {
        stringStyle: {
          ...baseStringStyle,
          clickThrough:
            'https://mygrafana.grafana.net/d/$__pattern_0_$__pattern_1/?var-Job=$__cell_5&var-Host=$__cell_4&from=$__cell_0',
          clickThroughSanitize: false,
          splitByPattern: '/_/',
        },
      } as unknown as ColumnStyleItemType;
      const html = ProcessClickthrough(
        style,
        rows6,
        { valueFormatted: 'goldenkpis_ipmplscore_ipmplscore' } as FormattedColumnValue,
        fakeTimeRange,
        noopReplaceVariables,
      );
      expect(html).toContain(
        'href="https://mygrafana.grafana.net/d/goldenkpis_ipmplscore/?var-Job=goldenkpis_ipmplscore_ipmplscore&var-Host=GC8801-LER03&from=2026-06-02"',
      );
    });

    it('cell value containing = is percent-encoded in HTTP query params; & is treated as a param separator (documents current behaviour)', () => {
      // Macro expansion runs before the new URL() round-trip. This means:
      //   - '=' inside a cell value gets encoded to '%3D' by searchParams
      //   - '&' inside a cell value is treated as a query-parameter separator
      //     by the URL parser, silently splitting it into a new parameter
      //     instead of being preserved as a literal value.
      // This test pins the current (partially-broken) behaviour so any future
      // fix to pre-encode cell values before injection is an explicit, tested change.
      // TODO: pre-encode cell values before URL injection so & is preserved as %26.
      const rows1 = [
        { valueFormatted: 'a=1&b=2' } as FormattedColumnValue, // contains = and &
      ];
      const style = {
        stringStyle: {
          ...baseStringStyle,
          clickThrough: 'http://example.com/d?filter=$__cell_0',
          clickThroughSanitize: false,
        },
      } as unknown as ColumnStyleItemType;
      const html = ProcessClickthrough(style, rows1, processedItem, fakeTimeRange, noopReplaceVariables);
      // '=' is encoded → %3D; '&' splits the query so b=2 becomes a second param
      expect(html).toContain('filter=a%3D1&b=2');
    });

    it('passes cell values with special characters through unencoded for verbatim (non-HTTP) paths', () => {
      // Non-HTTP paths skip the new URL() round-trip, so special characters in
      // cell values are emitted raw. This documents the intentional asymmetry:
      // HTTP URLs are encoded, verbatim paths are not.
      const rows1 = [
        { valueFormatted: 'a&b' } as FormattedColumnValue,
      ];
      const style = {
        stringStyle: {
          ...baseStringStyle,
          clickThrough: 'custom://host/d?v=$__cell_0',
          clickThroughSanitize: false,
        },
      } as unknown as ColumnStyleItemType;
      const html = ProcessClickthrough(style, rows1, processedItem, fakeTimeRange, noopReplaceVariables);
      // verbatim path: no encoding applied
      expect(html).toContain('href="custom://host/d?v=a&b"');
    });

    it('returns null when columnStyle is null', () => {
      expect(ProcessClickthrough(null, [], processedItem, fakeTimeRange, noopReplaceVariables)).toBeNull();
    });

    it('returns null when clickThrough is an empty string', () => {
      const style = {
        stringStyle: { ...baseStringStyle, clickThrough: '' },
      } as unknown as ColumnStyleItemType;
      expect(ProcessClickthrough(style, [], processedItem, fakeTimeRange, noopReplaceVariables)).toBeNull();
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

    it('replaces ALL occurrences of $__from when it appears more than once', () => {
      // Non-global replace() only substitutes the first occurrence.
      // A URL with $__from in both path and query would leave the second as-is.
      expect(ReplaceTimeMacros(tr, '/$__from/range?from=$__from')).toBe('/now-6h/range?from=now-6h');
    });

    it('replaces ALL occurrences of $__to when it appears more than once', () => {
      expect(ReplaceTimeMacros(tr, 'a=$__to&b=$__to')).toBe('a=now&b=now');
    });
    it('treats $& in a raw.from value literally, not as "insert matched text"', () => {
      // $& in a replacement string re-inserts the entire matched token.
      // With a realistic URL containing both macros, the broken output has
      // $__from literally still present in the href — unmistakably wrong:
      //
      //   Broken:  ?from=$__from-path&to=now   ← macro not substituted
      //   Correct: ?from=$&-path&to=now
      //
      // Fix: callback () => from bypasses all $-pattern interpretation.
      const tr2 = {
        raw: { from: '$&-path', to: 'now' },
      } as unknown as TimeRange;
      expect(ReplaceTimeMacros(tr2, 'https://grafana.example.com/d/uid?from=$__from&to=$__to')).toBe(
        'https://grafana.example.com/d/uid?from=$&-path&to=now',
      );
    });

    it('treats $$ in a raw.from value literally, not as an escaped $', () => {
      // $$ in a replacement string collapses to a single $:
      //
      //   Broken:  ?from=$10&to=now   ← $$ → $, token number appended
      //   Correct: ?from=$$10&to=now
      const tr2 = {
        raw: { from: '$$10', to: 'now' },
      } as unknown as TimeRange;
      expect(ReplaceTimeMacros(tr2, 'https://grafana.example.com/d/uid?from=$__from&to=$__to')).toBe(
        'https://grafana.example.com/d/uid?from=$$10&to=now',
      );
    });

    it("treats $' in a raw.to value literally, not as 'text after match'", () => {
      // $' injects the portion of the string AFTER the match position.
      // With a URL that has content after $__to, the broken output
      // duplicates that trailing content:
      //
      //   Broken:  ?to=&extra=data&extra=data   ← "&extra=data" injected twice
      //   Correct: ?to=$'&extra=data
      const tr2 = {
        raw: { from: 'now', to: "$'" },
      } as unknown as TimeRange;
      expect(ReplaceTimeMacros(tr2, 'https://grafana.example.com/d/uid?to=$__to&extra=data')).toBe(
        "https://grafana.example.com/d/uid?to=$'&extra=data",
      );
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

    it('replaces ALL occurrences of $__cell when it appears more than once in the URL', () => {
      // /\$__cell\b/ is non-global — only the first occurrence is replaced.
      // A link template like 'name=$__cell&label=$__cell' leaves the second
      // reference unresolved.
      expect(ReplaceCellMacros('name=$__cell&label=$__cell', 'srv', rows)).toBe('name=srv&label=srv');
    });

    it('treats cell content containing $& literally, not as a regex replacement pattern', () => {
      // Bug: String.replace(regex, string) interprets $& in the replacement as
      // "insert the matched text". A cell value like "$&-suffix" causes the
      // macro token ($__cell) to be re-inserted instead of replaced.
      // e.g. 'url=$__cell'.replace(/\$__cell\b/g, '$&-suffix')
      //   → 'url=$__cell-suffix'   ← macro NOT substituted
      // Fix: use a callback () => cellContent so $ is never interpreted.
      expect(ReplaceCellMacros('url=$__cell', '$&-suffix', rows)).toBe('url=$&-suffix');
    });

    it('treats cell content containing $$ literally, not as a regex replacement pattern', () => {
      // $$ in a replacement string is the escape for a literal $, so
      // String.replace(regex, '$$10') produces '$10' rather than '$$10'.
      expect(ReplaceCellMacros('v=$__cell', '$$10', rows)).toBe('v=$$10');
    });

    it("treats cell content containing $' literally, not as a regex replacement pattern", () => {
      // $' inserts the portion of the string after the match.
      // For 'prefix/$__cell/suffix', replacing with "$'" would inject '/suffix'
      // instead of the literal string "$'".
      expect(ReplaceCellMacros("prefix/$__cell/suffix", "$'", rows)).toBe("prefix/$'/suffix");
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

    it('treats a null valueFormatted as the string "null" (documents current coercion behaviour)', () => {
      // rows[idx].valueFormatted could be null at runtime if a frame field
      // produced no value. JS string coercion turns null → "null" and
      // undefined → "undefined", silently putting those strings in the href.
      // This test pins the current behaviour so any future guard is explicit.
      const nullRows = [{ valueFormatted: null }] as unknown as Array<FormattedColumnValue>;
      expect(ReplaceCellMacros('v=$__cell_0', 'X', nullRows)).toBe('v=null');
    });

    it('returns the input untouched when no macros are present', () => {
      expect(ReplaceCellMacros('http://x/plain', 'X', rows)).toBe('http://x/plain');
    });

    it('replaces ALL $__cell_N occurrences when the URL contains multiple references (issue #324)', () => {
      // Bug: the non-global regex + match() only finds the first $__cell_N.
      // With three distinct $__cell_N references in one URL, only the first
      // was replaced; the rest were left as literals and then URL-encoded by
      // the browser (%24__cell_N).
      const r = [
        { valueFormatted: '2026-06-02' } as FormattedColumnValue, // $__cell_0 — from
        { valueFormatted: 'r1' } as FormattedColumnValue,
        { valueFormatted: 'r2' } as FormattedColumnValue,
        { valueFormatted: 'r3' } as FormattedColumnValue,
        { valueFormatted: 'GC8801-LER03' } as FormattedColumnValue,  // $__cell_4 — host
        { valueFormatted: 'job-name' } as FormattedColumnValue,       // $__cell_5 — job
      ];
      const out = ReplaceCellMacros(
        'var-Job=$__cell_5&var-Host=$__cell_4&from=$__cell_0',
        'active',
        r,
      );
      expect(out).toBe('var-Job=job-name&var-Host=GC8801-LER03&from=2026-06-02');
    });

    it('replaces the same $__cell_N index appearing multiple times in one URL', () => {
      // A cell index can legitimately be referenced more than once, e.g.
      // both in the path and in a query parameter.
      const r = [
        { valueFormatted: 'svc-a' } as FormattedColumnValue,
        { valueFormatted: 'prod' } as FormattedColumnValue,
      ];
      const out = ReplaceCellMacros('/$__cell_0/detail?name=$__cell_0&env=$__cell_1', 'svc-a', r);
      expect(out).toBe('/svc-a/detail?name=svc-a&env=prod');
    });

    it('does not corrupt a higher-index cell when a lower-index cell appears after it (e.g. $__cell_10 vs $__cell_1)', () => {
      // The non-global string replace('$__cell_1', ...) would match the
      // '$__cell_1' prefix inside '$__cell_10' if the two-digit reference
      // appears first in the URL. The hardened single-pass replace avoids this.
      // Only indices 1 and 10 are referenced — populate exactly those two.
      // Indices 0-9 use placeholder values; the test cares about [1] and [10].
      const r: FormattedColumnValue[] = Array.from({ length: 11 }, (_, i) =>
        ({ valueFormatted: `cell-${i}` } as FormattedColumnValue)
      );
      r[1] = { valueFormatted: 'one' } as FormattedColumnValue;
      r[10] = { valueFormatted: 'ten' } as FormattedColumnValue;
      // $__cell_10 appears before $__cell_1 in the URL.
      // A string replace('$__cell_1', ...) on the mutated string would
      // find the '$__cell_1' prefix inside '$__cell_10' before $__cell_10
      // is processed, mangling the result.
      const out = ReplaceCellMacros('a=$__cell_10&b=$__cell_1', 'X', r);
      expect(out).toBe('a=ten&b=one');
    });

    it('does not re-substitute when a cell value itself contains a $__cell_N pattern', () => {
      // Latent bug: rows[1].valueFormatted = '$__cell_0' (looks like a macro).
      // URL has $__cell_1 BEFORE $__cell_0 so the loop processes cell_1 first,
      // injecting the literal text '$__cell_0' into `formatted`. The next
      // iteration then calls replace('$__cell_0', ...) on the mutated string
      // and finds the *injected* text rather than the original $__cell_0
      // reference — producing the wrong result.
      //
      // Expected:  b=$__cell_0&a=real-value
      //   ($__cell_1 → its raw value '$__cell_0'; original $__cell_0 → 'real-value')
      // Broken:    b=real-value&a=$__cell_0
      //   (injected '$__cell_0' gets expanded; original reference left as-is)
      const r = [
        { valueFormatted: 'real-value' } as FormattedColumnValue,
        { valueFormatted: '$__cell_0' } as FormattedColumnValue, // value contains a macro pattern
      ];
      const out = ReplaceCellMacros('b=$__cell_1&a=$__cell_0', 'X', r);
      expect(out).toBe('b=$__cell_0&a=real-value');
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

    it('returns input untouched when cellContent.valueFormatted is null', () => {
      // If cellContent is a non-null object but valueFormatted is null
      // (e.g. a string-type DataFrame column whose cell value is null),
      // the guard `!cellContent || cellContent.valueFormatted.length === 0`
      // crashes: !cellContent is false (object is truthy), then
      // null.length throws TypeError.
      const nullValueFormatted = { valueFormatted: null } as unknown as FormattedColumnValue;
      expect(
        ReplaceCellSplitByPattern('host=$__pattern_0', nullValueFormatted, '/\\s/'),
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

    it('replaces ALL occurrences of $__pattern_N when the same index appears more than once', () => {
      // values.map() calls replace() once per segment, but replace() is non-global,
      // so only the first occurrence of each $__pattern_N in the URL is replaced.
      // e.g. path/$__pattern_0?label=$__pattern_0 leaves the query-string copy unresolved.
      const cell = { valueFormatted: 'web-01 prod' } as FormattedColumnValue;
      const out = ReplaceCellSplitByPattern(
        '/$__pattern_0/d?label=$__pattern_0&env=$__pattern_1',
        cell,
        '/\\s/',
      );
      expect(out).toBe('/web-01/d?label=web-01&env=prod');
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
