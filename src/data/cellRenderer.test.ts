/**
 * Tests for Rendering a Cell
 */
import { DateFormats } from 'types';
import { applyFormat, FormatColumnValue, ProcessClickthrough, ReplaceTimeMacros, TimeFormatter } from './cellRenderer';
import { Field, FieldConfig, FieldType, GrafanaTheme2, TimeRange, dateTime} from '@grafana/data';
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
          1744486055000,
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
      const result = TimeFormatter('utc', 1744486055000, DateFormats[5].value);
      expect(result.valueFormatted).toEqual('2025-04-12T19:27:35+00:00');
    });
    describe('Test numeric to America/Denver formatting', () => {
      const result = TimeFormatter('America/Denver', 1744486055000, 'YYYY-MM-DDTHH:mm:ssZ');
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
  });

  describe('ProcessClickthrough — URL reconstruction (issue #276)', () => {
    // Minimal stringStyle fixture that exercises the URL-rebuild code path
    // without triggering macro replacement or sanitisation.
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

    const processedItem = { valueFormatted: 'cellText' } as any;

    const run = (clickThrough: string) =>
      ProcessClickthrough(
        { stringStyle: { ...baseStringStyle, clickThrough } } as any,
        /* columns */ [],
        /* rows */ [],
        /* rowIndex */ 0,
        processedItem,
        fakeTimeRange,
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
    ])('$label', ({ input, expected }) => {
      const html = run(input);
      expect(html).toContain(expected);
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
