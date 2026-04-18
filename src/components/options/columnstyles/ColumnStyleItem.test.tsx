import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnStyleItem } from './ColumnStyleItem';
import { ColumnStyles, type ColumnStyleItemType } from './types';
import { ColumnAlignment, ColumnStyleColoring, DateFormats } from 'types';
import type { Threshold } from '../thresholds/types';

// Stub ThresholdsEditor so we can invoke its `setter` directly from a test
// button. The real editor's internal behavior is covered by its own tests.
jest.mock('../thresholds/ThresholdsEditor', () => ({
  ThresholdsEditor: ({ setter }: { setter: (t: Threshold[]) => void }) => (
    <button
      data-testid="stub-add-threshold"
      onClick={() =>
        setter([{ color: '#00ff00', state: 0, value: 50 }])
      }
    >
      add
    </button>
  ),
}));

// @grafana/ui Select uses react-select internally, which is painful to drive
// from tests. Replace it with a button-per-option passthrough so tests can
// trigger onChange deterministically.
jest.mock('@grafana/ui', () => {
  const actual = jest.requireActual('@grafana/ui');
  return {
    ...actual,
    Select: ({ value, onChange, options }: any) => (
      <div data-testid={`select-value-${value}`}>
        {(options ?? []).map((opt: any) => (
          <button
            key={opt.value}
            data-testid={`option-${opt.value}`}
            onClick={() => onChange(opt)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    ),
  };
});

const makeStyle = (): ColumnStyleItemType => ({
  label: 'Style-0',
  nameOrRegex: 'A-series',
  order: 0,
  enabled: true,
  activeStyle: ColumnStyles.METRIC,
  dateStyle: { dateFormat: DateFormats[0].value } as any,
  hiddenStyle: {} as any,
  metricStyle: {
    alias: 'alias-val',
    thresholds: [],
    colors: ['#111', '#222', '#333', '#444'],
    colorMode: ColumnStyleColoring.Cell,
    decimals: '3',
    scaledDecimals: 2,
    unitFormat: 'percent',
    ignoreNullValues: false,
  },
  stringStyle: {
    clickThrough: '',
    clickThroughCustomTarget: '',
    clickThroughCustomTargetEnabled: false,
    clickThroughOpenNewTab: true,
    clickThroughSanitize: true,
    splitByPattern: '',
  } as any,
});

const renderItem = (overrides: Partial<Record<string, any>> = {}) => {
  const setter = jest.fn();
  render(
    <ColumnStyleItem
      ID="uuid-1"
      style={makeStyle()}
      enabled={true}
      columnHints={[]}
      context={{} as any}
      setter={setter}
      remover={jest.fn()}
      moveUp={jest.fn()}
      moveDown={jest.fn()}
      createDuplicate={jest.fn()}
      {...overrides}
    />,
  );
  return setter;
};

describe('ColumnStyleItem', () => {
  it('preserves every metricStyle field when thresholds change', () => {
    const setter = renderItem();

    fireEvent.click(screen.getByTestId('stub-add-threshold'));

    const [order, emitted] = setter.mock.calls.at(-1)!;
    expect(order).toBe(0);

    // The reason this test exists: setThresholds used to hand-copy the
    // metricStyle fields and silently drop `colorMode`, which then
    // suppressed cell coloring because getCellColors bails on
    // `colorMode != null`. Assert the full metricStyle shape round-trips.
    expect(emitted.metricStyle).toEqual({
      alias: 'alias-val',
      thresholds: [{ color: '#00ff00', state: 0, value: 50 }],
      colors: ['#111', '#222', '#333', '#444'],
      colorMode: ColumnStyleColoring.Cell,
      decimals: '3',
      scaledDecimals: 2,
      unitFormat: 'percent',
      ignoreNullValues: false,
    });
  });

  it.each([
    [ColumnAlignment.LEFT],
    [ColumnAlignment.CENTER],
    [ColumnAlignment.RIGHT],
  ])('Cell Alignment selection emits align=%s', (expected) => {
    const setter = renderItem();

    fireEvent.click(screen.getByTestId(`option-${expected}`));

    const [order, emitted] = setter.mock.calls.at(-1)!;
    expect(order).toBe(0);
    expect(emitted.align).toBe(expected);
  });

  it('Cell Alignment Select falls back to "default" when style.align is undefined', () => {
    // The Select stub exposes the `value` prop via its data-testid. A style
    // built without an `align` field (e.g. a pre-#282 migrated panel whose
    // applyOptionDefaults has not yet stamped one) should surface as
    // ColumnAlignment.DEFAULT in the editor so the UI matches the runtime
    // behavior.
    const setter = jest.fn();
    const style = { ...makeStyle(), align: undefined } as any;
    render(
      <ColumnStyleItem
        ID="uuid-1"
        style={style}
        enabled={true}
        columnHints={[]}
        context={{} as any}
        setter={setter}
        remover={jest.fn()}
        moveUp={jest.fn()}
        moveDown={jest.fn()}
        createDuplicate={jest.fn()}
      />,
    );

    expect(screen.getByTestId(`select-value-${ColumnAlignment.DEFAULT}`)).toBeInTheDocument();
  });
});
