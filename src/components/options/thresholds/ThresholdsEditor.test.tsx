import React, { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThresholdsEditor } from './ThresholdsEditor';
import type { Threshold } from './types';

// Stub ThresholdItem so we can drive setters/remover via deterministic buttons.
jest.mock('./ThresholdItem', () => ({
  ThresholdItem: ({
    ID,
    threshold,
    valueSetter,
    colorSetter,
    stateSetter,
    remover,
    index,
  }: any) => (
    <div data-testid={`row-${ID}`} data-index={index}>
      <span data-testid={`row-${ID}-value`}>{threshold.value}</span>
      <span data-testid={`row-${ID}-color`}>{threshold.color}</span>
      <span data-testid={`row-${ID}-state`}>{threshold.state}</span>
      <button onClick={() => valueSetter(index, 99)}>set-value</button>
      <button onClick={() => colorSetter(index, 'red')}>set-color</button>
      <button onClick={() => stateSetter(index, 1)}>set-state-warn</button>
      <button onClick={() => stateSetter(index, 3)}>set-state-custom</button>
      <button onClick={() => remover(index)}>remove</button>
    </div>
  ),
}));

// useTheme2 returns a stub visualization resolver.
jest.mock('@grafana/ui', () => {
  const actual = jest.requireActual('@grafana/ui');
  return {
    ...actual,
    useTheme2: () => ({
      visualization: {
        getColorByName: (name: string) => `resolved-${name}`,
      },
    }),
  };
});

// Deterministic UUIDs for stable ID assertions.
jest.mock('uuid', () => {
  let n = 0;
  return { v4: () => `uuid-${++n}` };
});

const baseThresholds = (): Threshold[] => [
  { color: '#00ff00', state: 0, value: 10 },
  { color: '#ffff00', state: 1, value: 20 },
];

describe('ThresholdsEditor', () => {
  it('renders one row per threshold', () => {
    const setter = jest.fn();
    render(<ThresholdsEditor thresholds={baseThresholds()} setter={setter} />);

    expect(screen.getAllByTestId(/^row-uuid-\d+$/)).toHaveLength(2);
  });

  it('add appends a default OK threshold (state 0, green) and emits via setter', () => {
    const setter = jest.fn();
    render(<ThresholdsEditor thresholds={baseThresholds()} setter={setter} />);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Add Threshold' }));
    });

    const last = setter.mock.calls.at(-1)![0] as Threshold[];
    expect(last).toHaveLength(3);
    expect(last[2]).toEqual({ color: expect.any(String), state: 0, value: 0 });
  });

  it('editing a value sorts the emitted threshold list ascending', () => {
    const setter = jest.fn();
    render(<ThresholdsEditor thresholds={baseThresholds()} setter={setter} />);

    // Row 0 has value 10. The stub sets it to 99, which should push it to the end.
    act(() => {
      fireEvent.click(screen.getAllByRole('button', { name: 'set-value' })[0]);
    });

    const emitted = setter.mock.calls.at(-1)![0] as Threshold[];
    expect(emitted.map((t) => t.value)).toEqual([20, 99]);
  });

  it('editing state < 3 overrides color via colorForThresholdState', () => {
    const setter = jest.fn();
    render(<ThresholdsEditor thresholds={baseThresholds()} setter={setter} />);

    act(() => {
      fireEvent.click(screen.getAllByRole('button', { name: 'set-state-warn' })[0]);
    });

    const emitted = setter.mock.calls.at(-1)![0] as Threshold[];
    expect(emitted[0].state).toBe(1);
    expect(emitted[0].color).not.toBe('#00ff00'); // overwritten
  });

  it('editing state >= 3 leaves color untouched', () => {
    const setter = jest.fn();
    render(<ThresholdsEditor thresholds={baseThresholds()} setter={setter} />);

    act(() => {
      fireEvent.click(screen.getAllByRole('button', { name: 'set-state-custom' })[0]);
    });

    const emitted = setter.mock.calls.at(-1)![0] as Threshold[];
    expect(emitted[0].state).toBe(3);
    expect(emitted[0].color).toBe('#00ff00');
  });

  it('editing color emits the resolved color from the theme', () => {
    const setter = jest.fn();
    render(<ThresholdsEditor thresholds={baseThresholds()} setter={setter} />);

    act(() => {
      fireEvent.click(screen.getAllByRole('button', { name: 'set-color' })[0]);
    });

    const emitted = setter.mock.calls.at(-1)![0] as Threshold[];
    expect(emitted[0].color).toBe('resolved-red');
  });

  it('remove drops the row and emits the shorter list', () => {
    const setter = jest.fn();
    render(<ThresholdsEditor thresholds={baseThresholds()} setter={setter} />);

    act(() => {
      fireEvent.click(screen.getAllByRole('button', { name: 'remove' })[0]);
    });

    const emitted = setter.mock.calls.at(-1)![0] as Threshold[];
    expect(emitted).toHaveLength(1);
    expect(emitted[0].value).toBe(20);
  });
});
