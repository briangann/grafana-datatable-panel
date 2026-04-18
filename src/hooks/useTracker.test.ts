import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { TrackerAdapter, useTracker } from './useTracker';

type FixtureItem = { id: string; order: number; label: string };
type FixturePayload = { label: string };

const adapter: TrackerAdapter<FixtureItem, FixturePayload> = {
  toPayload: (item) => ({ label: item.label }),
  reorder: (item, index) => ({ ...item, order: index }),
};

const initial = (): FixtureItem[] => [
  { id: 'a', order: 0, label: 'A' },
  { id: 'b', order: 1, label: 'B' },
  { id: 'c', order: 2, label: 'C' },
];

describe('useTracker', () => {
  it('add appends an item and fires onChange with projected payloads', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTracker(initial, onChange, adapter));

    const newItem: FixtureItem = { id: 'd', order: 3, label: 'D' };
    act(() => result.current.add(newItem));

    expect(result.current.items).toHaveLength(4);
    expect(result.current.items[3]).toEqual(newItem);
    expect(onChange).toHaveBeenLastCalledWith([
      { label: 'A' },
      { label: 'B' },
      { label: 'C' },
      { label: 'D' },
    ]);
  });

  it('removeAt drops target and re-numbers surviving items via adapter', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTracker(initial, onChange, adapter));

    act(() => result.current.removeAt(1));

    expect(result.current.items).toEqual([
      { id: 'a', order: 0, label: 'A' },
      { id: 'c', order: 1, label: 'C' },
    ]);
    expect(onChange).toHaveBeenLastCalledWith([{ label: 'A' }, { label: 'C' }]);
  });

  it('updateAt patches target and preserves reference identity of siblings', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTracker(initial, onChange, adapter));
    const before = result.current.items;

    act(() => result.current.updateAt(1, { label: 'B prime' }));

    const after = result.current.items;
    expect(after[1]).toEqual({ id: 'b', order: 1, label: 'B prime' });
    expect(after[0]).toBe(before[0]);
    expect(after[2]).toBe(before[2]);
    expect(onChange).toHaveBeenLastCalledWith([
      { label: 'A' },
      { label: 'B prime' },
      { label: 'C' },
    ]);
  });

  it('updateAt with an out-of-range index is a no-op', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTracker(initial, onChange, adapter));
    const before = result.current.items;

    act(() => result.current.updateAt(99, { label: 'Z' }));

    expect(result.current.items).toBe(before);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('updateAt with an empty patch is a no-op', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTracker(initial, onChange, adapter));
    const before = result.current.items;

    act(() => result.current.updateAt(1, {}));

    expect(result.current.items).toBe(before);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('updateAt with a functional patch returning {} is a no-op', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTracker(initial, onChange, adapter));
    const before = result.current.items;

    act(() => result.current.updateAt(1, () => ({})));

    expect(result.current.items).toBe(before);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('updateAt accepts a functional patch that reads the live item', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTracker(initial, onChange, adapter));

    act(() => result.current.updateAt(1, (t) => ({ label: `${t.label}!` })));

    expect(result.current.items[1]).toEqual({ id: 'b', order: 1, label: 'B!' });
    expect(onChange).toHaveBeenLastCalledWith([
      { label: 'A' },
      { label: 'B!' },
      { label: 'C' },
    ]);
  });

  it('moveUp(0) is a no-op', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTracker(initial, onChange, adapter));
    const before = result.current.items;

    act(() => result.current.moveUp(0));

    expect(result.current.items).toBe(before);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('moveDown(length - 1) is a no-op', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTracker(initial, onChange, adapter));
    const before = result.current.items;

    act(() => result.current.moveDown(2));

    expect(result.current.items).toBe(before);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('moveUp swaps neighbors and re-numbers via adapter', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTracker(initial, onChange, adapter));

    act(() => result.current.moveUp(1));

    expect(result.current.items).toEqual([
      { id: 'b', order: 0, label: 'B' },
      { id: 'a', order: 1, label: 'A' },
      { id: 'c', order: 2, label: 'C' },
    ]);
    expect(onChange).toHaveBeenLastCalledWith([
      { label: 'B' },
      { label: 'A' },
      { label: 'C' },
    ]);
  });

  it('moveDown swaps neighbors and re-numbers via adapter', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTracker(initial, onChange, adapter));

    act(() => result.current.moveDown(0));

    expect(result.current.items).toEqual([
      { id: 'b', order: 0, label: 'B' },
      { id: 'a', order: 1, label: 'A' },
      { id: 'c', order: 2, label: 'C' },
    ]);
    expect(onChange).toHaveBeenLastCalledWith([
      { label: 'B' },
      { label: 'A' },
      { label: 'C' },
    ]);
  });

  it('setAll replaces state and emits new payloads', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTracker(initial, onChange, adapter));

    const next: FixtureItem[] = [{ id: 'z', order: 0, label: 'Z' }];
    act(() => result.current.setAll(next));

    expect(result.current.items).toEqual(next);
    expect(onChange).toHaveBeenLastCalledWith([{ label: 'Z' }]);
  });

  it('operates without a reorder adapter, leaving order fields untouched', () => {
    const onChange = jest.fn();
    const noReorder: TrackerAdapter<FixtureItem, FixturePayload> = {
      toPayload: (item) => ({ label: item.label }),
    };
    const { result } = renderHook(() => useTracker(initial, onChange, noReorder));

    act(() => result.current.removeAt(0));

    expect(result.current.items).toEqual([
      { id: 'b', order: 1, label: 'B' },
      { id: 'c', order: 2, label: 'C' },
    ]);
  });
});
