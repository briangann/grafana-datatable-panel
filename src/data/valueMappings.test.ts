import { MappingType, SpecialValueMatch, ValueMapping } from '@grafana/data';
import { getValueMappingResult, isNumeric } from './valueMappings';

const valueToText = (options: Record<string, { text?: string; color?: string }>): ValueMapping =>
  ({ type: MappingType.ValueToText, options } as ValueMapping);

const rangeToText = (
  from: number | null,
  to: number | null,
  result: { text?: string; color?: string },
): ValueMapping =>
  ({
    type: MappingType.RangeToText,
    options: { from: from ?? undefined, to: to ?? undefined, result },
  } as unknown as ValueMapping);

const regexToText = (pattern: string, result: { text?: string }): ValueMapping =>
  ({
    type: MappingType.RegexToText,
    options: { pattern, result },
  } as unknown as ValueMapping);

const specialValue = (match: SpecialValueMatch, result: { text?: string }): ValueMapping =>
  ({
    type: MappingType.SpecialValue,
    options: { match, result },
  } as unknown as ValueMapping);

describe('getValueMappingResult', () => {
  describe('ValueToText', () => {
    it('returns the mapped result when the key exists', () => {
      const mapping = valueToText({ online: { text: 'UP' }, offline: { text: 'DOWN' } });
      expect(getValueMappingResult([mapping], 'online')).toEqual({ text: 'UP' });
    });

    it('returns null when the key is not in the map', () => {
      const mapping = valueToText({ online: { text: 'UP' } });
      expect(getValueMappingResult([mapping], 'unknown')).toBeNull();
    });

    it('skips the mapping when the value is null', () => {
      const mapping = valueToText({ online: { text: 'UP' } });
      expect(getValueMappingResult([mapping], null)).toBeNull();
    });
  });

  describe('RangeToText', () => {
    it('returns the result for a value inside the range', () => {
      const mapping = rangeToText(0, 10, { text: 'low' });
      expect(getValueMappingResult([mapping], 5)).toEqual({ text: 'low' });
    });

    it('returns null for a value below the range', () => {
      const mapping = rangeToText(0, 10, { text: 'low' });
      expect(getValueMappingResult([mapping], -1)).toBeNull();
    });

    it('returns null for a value above the range', () => {
      const mapping = rangeToText(0, 10, { text: 'low' });
      expect(getValueMappingResult([mapping], 11)).toBeNull();
    });

    it('skips the mapping for non-numeric input', () => {
      const mapping = rangeToText(0, 10, { text: 'low' });
      expect(getValueMappingResult([mapping], 'abc')).toBeNull();
    });

    it('treats an unset `from` as -Infinity', () => {
      const mapping = rangeToText(null, 10, { text: 'low' });
      expect(getValueMappingResult([mapping], -9999)).toEqual({ text: 'low' });
    });

    it('treats an unset `to` as +Infinity', () => {
      const mapping = rangeToText(0, null, { text: 'high' });
      expect(getValueMappingResult([mapping], 9999)).toEqual({ text: 'high' });
    });
  });

  describe('RegexToText', () => {
    it('returns the result for a matching regex, rewriting the matched substring', () => {
      // The result text is applied via `value.replace(regex, resultText)` —
      // the unmatched suffix is preserved and concatenated. Pinning this
      // documents the behavior explicitly; callers who want a full-string
      // rewrite anchor the pattern with `$` (see the capture-group case).
      const mapping = regexToText('/^web-/', { text: 'host-' });
      expect(getValueMappingResult([mapping], 'web-01')).toEqual({ text: 'host-01' });
    });

    it('performs capture-group replacement in the result text', () => {
      const mapping = regexToText('/^web-(\\d+)$/', { text: 'host-$1' });
      expect(getValueMappingResult([mapping], 'web-42')).toEqual({ text: 'host-42' });
    });

    it('returns null when the regex does not match', () => {
      const mapping = regexToText('/^web-/', { text: 'web host' });
      expect(getValueMappingResult([mapping], 'db-01')).toBeNull();
    });

    it('skips the mapping for non-string input', () => {
      const mapping = regexToText('/^web-/', { text: 'web host' });
      expect(getValueMappingResult([mapping], 42)).toBeNull();
    });
  });

  describe('SpecialValue', () => {
    it('matches Null when the value is null', () => {
      const mapping = specialValue(SpecialValueMatch.Null, { text: 'N/A' });
      expect(getValueMappingResult([mapping], null)).toEqual({ text: 'N/A' });
    });

    it('matches NaN when the value is NaN', () => {
      const mapping = specialValue(SpecialValueMatch.NaN, { text: 'NaN' });
      expect(getValueMappingResult([mapping], NaN)).toEqual({ text: 'NaN' });
    });

    it('matches NullAndNaN for both null and NaN', () => {
      const mapping = specialValue(SpecialValueMatch.NullAndNaN, { text: 'missing' });
      expect(getValueMappingResult([mapping], null)).toEqual({ text: 'missing' });
      expect(getValueMappingResult([mapping], NaN)).toEqual({ text: 'missing' });
    });

    it.each([
      [SpecialValueMatch.True, true, 'yes'],
      [SpecialValueMatch.True, 'true', 'yes'],
      [SpecialValueMatch.False, false, 'no'],
      [SpecialValueMatch.False, 'false', 'no'],
      [SpecialValueMatch.Empty, '', 'empty'],
    ])('matches %s on %j', (match, input, expected) => {
      const mapping = specialValue(match, { text: expected });
      expect(getValueMappingResult([mapping], input)).toEqual({ text: expected });
    });
  });

  it('returns null when no mapping matches', () => {
    expect(getValueMappingResult([], 'anything')).toBeNull();
  });

  it('walks the list in order and returns the first match', () => {
    const first = valueToText({ hit: { text: 'FIRST' } });
    const second = valueToText({ hit: { text: 'SECOND' } });
    expect(getValueMappingResult([first, second], 'hit')).toEqual({ text: 'FIRST' });
  });

  it('falls through a non-matching RegexToText to the next mapping without matching SpecialValue', () => {
    // Pins the bug that the `case MappingType.RegexToText:` branch was
    // missing a `break;` — before the fix, a non-matching regex would fall
    // through and attempt to evaluate the SpecialValue inner switch against
    // the RegexToText options (usually a no-op because `options.match` is
    // undefined, but fragile). With the `break;` in place, the next mapping
    // in the list is consulted cleanly.
    const regex = regexToText('/^never-matches-/', { text: 'X' });
    const fallback = valueToText({ '7': { text: 'lucky' } });
    expect(getValueMappingResult([regex, fallback], '7')).toEqual({ text: 'lucky' });
  });
});

describe('isNumeric', () => {
  it.each([
    [0, true],
    [1.5, true],
    [-10, true],
    ['42', true],
    ['3.14', true],
    [' 5 ', true],
    ['', false],
    ['abc', false],
    [NaN, false],
    [null, false],
    [undefined, false],
    [{}, false],
  ])('isNumeric(%j) === %s', (input, expected) => {
    expect(isNumeric(input)).toBe(expected);
  });
});
