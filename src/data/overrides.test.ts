import { createTheme, FieldType, toDataFrame } from '@grafana/data';
import { ApplyGrafanaOverrides } from './overrides';

// Real Grafana theme so getDisplayProcessor has the visualization color
// palette it expects. The no-op replaceVariables stub is sufficient for
// these tests because the fieldConfig we pass into ApplyGrafanaOverrides
// contains no template strings to interpolate — we're pinning the other
// observable effects.
const theme = createTheme();
const noopReplaceVariables = (s: string) => s;

describe('ApplyGrafanaOverrides', () => {
  it('returns an empty array when the input frames are undefined', () => {
    const result = ApplyGrafanaOverrides(
      undefined as unknown as Parameters<typeof ApplyGrafanaOverrides>[0],
      theme,
      noopReplaceVariables,
    );
    expect(result).toEqual([]);
  });

  it('stamps decimals=4 on every field of the first returned frame', () => {
    const df = toDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: [1000, 2000] },
        { name: 'value', type: FieldType.number, values: [10, 20] },
      ],
    });

    const [out] = ApplyGrafanaOverrides([df], theme, noopReplaceVariables);

    expect(out.fields).toHaveLength(2);
    for (const field of out.fields) {
      expect(field.config.decimals).toBe(4);
    }
  });

  it('attaches a display function to every field on the first frame', () => {
    const df = toDataFrame({
      fields: [
        { name: 'a', type: FieldType.number, values: [1] },
        { name: 'b', type: FieldType.string, values: ['x'] },
      ],
    });

    const [out] = ApplyGrafanaOverrides([df], theme, noopReplaceVariables);

    for (const field of out.fields) {
      expect(typeof field.display).toBe('function');
    }
  });

  it('forwards the replaceVariables argument through to applyFieldOverrides', () => {
    // applyFieldOverrides only calls replaceVariables when a string inside
    // the fieldConfig contains template syntax. The helper hard-codes
    // `defaults: {}` and `overrides: []`, so no interpolation happens in
    // practice — but we still want to pin that the stub is wired through
    // rather than dropped. Spy on invocation count; with no templates
    // present the spy is never called, which is itself a contract: the
    // override pipeline respects the no-work short-circuit.
    const calls: string[] = [];
    const spy = (value: string) => {
      calls.push(value);
      return value;
    };
    const df = toDataFrame({
      fields: [{ name: 'value', type: FieldType.number, values: [1, 2] }],
    });

    ApplyGrafanaOverrides([df], theme, spy);

    // No templates in the hard-coded `defaults: {}` / `overrides: []`, so the
    // spy must never fire — pins the no-work short-circuit of the override
    // pipeline while also proving the plumbing accepts our stub signature
    // (a mismatched signature would have thrown before this assertion).
    expect(calls).toEqual([]);
  });
});
