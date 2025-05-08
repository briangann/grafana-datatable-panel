/**
 * Tests for Rendering a Cell
 */
import { DateFormats } from 'types';
import { FormatColumnValue, ReplaceTimeMacros, TimeFormatter } from './cellRenderer';
import { Field, FieldConfig, FieldType, GrafanaTheme2 } from '@grafana/data';
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
          aField,
          1,
          0,
          1744486055000,
          'time',
          'time1',
          'time2',
          theme2,
        );
        expect(result).toEqual('2025-04-12T19:27:35+00:00');
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
          aField,
          1,
          0,
          123.456,
          'other',
          'fromTime',
          'toTime',
          theme2,
        );
        // show just return a string with the value inside
        expect(result).toEqual('123.456');
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
          aField,
          1,
          0,
          123.456,
          'number',
          'fromTime',
          'toTime',
          theme2,
        );
        expect(result).toEqual('123.456 kwh');
      });
    });
  });

  describe('Test TimeFormatter', () => {
    describe('Test numeric to UTC formatting', () => {
      const result = TimeFormatter('utc', 1744486055000, DateFormats[5].value);
      expect(result).toEqual('2025-04-12T19:27:35+00:00');
    });
    describe('Test numeric to America/Denver formatting', () => {
      const result = TimeFormatter('America/Denver', 1744486055000, 'YYYY-MM-DDTHH:mm:ssZ');
      expect(result).toEqual('2025-04-12T13:27:35-06:00');
    });
  });

  describe('Test ReplaceTimeMacros', () => {
    describe('Test replace $__from', () => {
      let content = 'content with $__from';
      const timeFrom = 'x';
      const timeTo = 'y';
      const result = ReplaceTimeMacros(timeFrom, timeTo, content);
      expect(result).toEqual('content with x');
    });
    describe('Test replace $__to', () => {
      let content = 'content with $__to';
      const timeFrom = 'x';
      const timeTo = 'y';
      const result = ReplaceTimeMacros(timeFrom, timeTo, content);
      expect(result).toEqual('content with y');
    });
    describe('Test replace $__keepTime', () => {
      let content = 'content with $__keepTime';
      const timeFrom = 'x';
      const timeTo = 'y';
      const result = ReplaceTimeMacros(timeFrom, timeTo, content);
      expect(result).toEqual('content with from=x&to=y');
    });
  });

  describe('Test ProcessMacroForClickthrough', () => {
    describe('Test replace $__cell_N', () => {
    });
  });
});
