import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnStylesEditor } from './ColumnStylesEditor';
import { ColumnStyles, type ColumnStyleItemType } from './types';
import { ColumnStyleColoring, DateFormats } from 'types';

jest.mock('./ColumnStyleItem', () => ({
  ColumnStyleItem: ({
    ID,
    style,
    setter,
    remover,
    moveUp,
    moveDown,
    createDuplicate,
  }: any) => (
    <div data-testid={`item-${ID}`}>
      <span data-testid={`item-${ID}-label`}>{style.label}</span>
      <span data-testid={`item-${ID}-order`}>{style.order}</span>
      <button onClick={() => setter(style.order, { ...style, label: `${style.label}!` })}>
        edit
      </button>
      <button onClick={() => remover(style.order)}>remove</button>
      <button onClick={() => moveUp(style.order)}>up</button>
      <button onClick={() => moveDown(style.order)}>down</button>
      <button onClick={() => createDuplicate(style.order)}>duplicate</button>
    </div>
  ),
}));

jest.mock('uuid', () => {
  let n = 0;
  return { v4: () => `uuid-${++n}` };
});

jest.mock('@grafana/ui', () => {
  const actual = jest.requireActual('@grafana/ui');
  return {
    ...actual,
    Collapse: ({ children, isOpen, label, onToggle }: any) => (
      <div data-testid={`collapse-${label}`} data-isopen={String(!!isOpen)}>
        <button data-testid={`toggle-${label}`} onClick={onToggle}>
          toggle
        </button>
        {children}
      </div>
    ),
  };
});

const makeStyle = (order: number, label: string): ColumnStyleItemType => ({
  activeStyle: ColumnStyles.METRIC,
  enabled: true,
  label,
  nameOrRegex: '',
  order,
  dateStyle: { dateFormat: DateFormats[0].value } as any,
  hiddenStyle: {} as any,
  metricStyle: {
    alias: '',
    thresholds: [],
    colors: [],
    colorMode: ColumnStyleColoring.Cell,
    decimals: '2',
    scaledDecimals: null,
    unitFormat: 'short',
    ignoreNullValues: true,
  } as any,
  stringStyle: {
    clickThrough: '',
    clickThroughCustomTarget: '',
    clickThroughCustomTargetEnabled: false,
    clickThroughOpenNewTab: true,
    clickThroughSanitize: true,
    splitByPattern: '',
  } as any,
});

const buildContext = (styles: ColumnStyleItemType[]) =>
  ({
    options: { columnStylesConfig: styles },
    data: [],
  } as any);

describe('ColumnStylesEditor', () => {
  it('does not call onChange on initial mount', () => {
    const onChange = jest.fn();
    const styles = [makeStyle(0, 'A')];
    render(
      <ColumnStylesEditor
        {...({} as any)}
        context={buildContext(styles)}
        onChange={onChange}
      />,
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  it('preserves open state by ID across remove', () => {
    const styles = [makeStyle(0, 'A'), makeStyle(1, 'B'), makeStyle(2, 'C')];
    render(
      <ColumnStylesEditor
        {...({} as any)}
        context={buildContext(styles)}
        onChange={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('toggle-B'));
    expect(screen.getByTestId('collapse-B')).toHaveAttribute('data-isopen', 'true');

    fireEvent.click(screen.getAllByRole('button', { name: 'remove' })[0]);

    expect(screen.getByTestId('collapse-B')).toHaveAttribute('data-isopen', 'true');
    expect(screen.getByTestId('collapse-C')).toHaveAttribute('data-isopen', 'false');
  });

  it('renders one item per configured style', () => {
    const styles = [makeStyle(0, 'A'), makeStyle(1, 'B')];
    render(
      <ColumnStylesEditor
        {...({} as any)}
        context={buildContext(styles)}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getAllByTestId(/^item-uuid-\d+$/)).toHaveLength(2);
  });

  it('Add Style appends a tracker with order === prev.length', () => {
    const onChange = jest.fn();
    const styles = [makeStyle(0, 'A')];
    render(
      <ColumnStylesEditor
        {...({} as any)}
        context={buildContext(styles)}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add Style' }));

    const emitted = onChange.mock.calls.at(-1)![0] as ColumnStyleItemType[];
    expect(emitted).toHaveLength(2);
    expect(emitted[1].order).toBe(1);
  });

  it('createDuplicate appends a copy and re-emits', () => {
    const onChange = jest.fn();
    const styles = [makeStyle(0, 'A')];
    render(
      <ColumnStylesEditor
        {...({} as any)}
        context={buildContext(styles)}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'duplicate' }));

    const emitted = onChange.mock.calls.at(-1)![0] as ColumnStyleItemType[];
    expect(emitted).toHaveLength(2);
    expect(emitted[1].label).toBe('A Copy');
  });

  it('moveDown swaps neighbors and re-numbers both order and style.order', () => {
    const onChange = jest.fn();
    const styles = [makeStyle(0, 'A'), makeStyle(1, 'B')];
    render(
      <ColumnStylesEditor
        {...({} as any)}
        context={buildContext(styles)}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'down' })[0]);

    const emitted = onChange.mock.calls.at(-1)![0] as ColumnStyleItemType[];
    expect(emitted.map((s) => s.label)).toEqual(['B', 'A']);
    expect(emitted.map((s) => s.order)).toEqual([0, 1]);
  });

  it('moveUp swaps neighbors and re-numbers', () => {
    const onChange = jest.fn();
    const styles = [makeStyle(0, 'A'), makeStyle(1, 'B')];
    render(
      <ColumnStylesEditor
        {...({} as any)}
        context={buildContext(styles)}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'up' })[1]);

    const emitted = onChange.mock.calls.at(-1)![0] as ColumnStyleItemType[];
    expect(emitted.map((s) => s.label)).toEqual(['B', 'A']);
    expect(emitted.map((s) => s.order)).toEqual([0, 1]);
  });

  it('removeColumnStyle(order) removes the matching tracker and re-numbers', () => {
    const onChange = jest.fn();
    const styles = [makeStyle(0, 'A'), makeStyle(1, 'B'), makeStyle(2, 'C')];
    render(
      <ColumnStylesEditor
        {...({} as any)}
        context={buildContext(styles)}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'remove' })[1]);

    const emitted = onChange.mock.calls.at(-1)![0] as ColumnStyleItemType[];
    expect(emitted.map((s) => s.label)).toEqual(['A', 'C']);
    expect(emitted.map((s) => s.order)).toEqual([0, 1]);
  });

  it('editing a style emits the patched entry', () => {
    const onChange = jest.fn();
    const styles = [makeStyle(0, 'A')];
    render(
      <ColumnStylesEditor
        {...({} as any)}
        context={buildContext(styles)}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'edit' }));

    const emitted = onChange.mock.calls.at(-1)![0] as ColumnStyleItemType[];
    expect(emitted[0].label).toBe('A!');
  });
});
