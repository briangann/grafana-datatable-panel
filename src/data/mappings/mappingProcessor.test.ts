import { MappingType, ValueMapping } from '@grafana/data';
import { FormattedColumnValue } from 'types';
import { ApplyMappings, GetMappings } from './mappingProcessor';

const valueMapping = (key: string, text: string): ValueMapping =>
  ({ type: MappingType.ValueToText, options: { [key]: { text } } } as ValueMapping);

const makeValue = (partial: Partial<FormattedColumnValue>): FormattedColumnValue =>
  ({
    valueRaw: 0,
    valueFormatted: '',
    valueRounded: 0,
    valueRoundedAndFormatted: 0,
    ...partial,
  } as FormattedColumnValue);

describe('GetMappings', () => {
  const fieldConfigMappings: ValueMapping[] = [valueMapping('a', 'alpha')];
  const dataMappings: ValueMapping[] = [valueMapping('b', 'bravo')];

  it('prefers fieldConfig mappings when they exist', () => {
    expect(GetMappings(fieldConfigMappings, dataMappings)).toBe(fieldConfigMappings);
  });

  it('falls back to data mappings when fieldConfig is empty', () => {
    expect(GetMappings([], dataMappings)).toBe(dataMappings);
  });

  it('falls back to data mappings when fieldConfig is undefined', () => {
    expect(GetMappings(undefined, dataMappings)).toBe(dataMappings);
  });

  it('returns undefined when neither source has mappings', () => {
    expect(GetMappings(undefined, undefined)).toBeUndefined();
  });
});

describe('ApplyMappings', () => {
  const mappings: ValueMapping[] = [valueMapping('online', 'UP')];

  it('returns null when the value is null or undefined', () => {
    expect(ApplyMappings(null as unknown as FormattedColumnValue, mappings)).toBeNull();
    expect(ApplyMappings(undefined as unknown as FormattedColumnValue, mappings)).toBeNull();
  });

  it('returns null when no mapping matches valueRaw=0', () => {
    // 0 is a valid valueRaw (not skipped); no mapping targets 0 in this set
    expect(ApplyMappings(makeValue({ valueRaw: 0 }), mappings)).toBeNull();
  });

  it('maps valueRaw=0 when a mapping explicitly targets 0', () => {
    const result = ApplyMappings(makeValue({ valueRaw: 0 }), [valueMapping('0', 'zero')]);
    expect(result).not.toBeNull();
    expect(result?.valueFormatted).toBe('zero');
  });

  it('returns null when no mapping matches the valueRaw', () => {
    expect(ApplyMappings(makeValue({ valueRaw: 'unknown' }), mappings)).toBeNull();
  });

  it('overwrites valueFormatted with the mapped text and returns the value', () => {
    const input = makeValue({ valueRaw: 'online', valueFormatted: 'raw-string' });
    const result = ApplyMappings(input, mappings);
    expect(result).not.toBeNull();
    expect(result?.valueFormatted).toBe('UP');
    // Returns the same object reference (mutates in place)
    expect(result).toBe(input);
  });

  it('defaults to an empty valueFormatted when the mapping result has no text', () => {
    const noTextMapping: ValueMapping[] = [
      { type: MappingType.ValueToText, options: { online: {} } } as ValueMapping,
    ];
    const input = makeValue({ valueRaw: 'online', valueFormatted: 'raw-string' });
    const result = ApplyMappings(input, noTextMapping);
    expect(result?.valueFormatted).toBe('');
  });
});
