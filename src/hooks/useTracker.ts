import { useCallback, useState } from 'react';

export interface TrackerAdapter<Item, Payload> {
  /** Extract the externally-visible payload from a tracker item for onChange emission. */
  toPayload: (item: Item) => Payload;
  /**
   * Re-number order fields after add/remove/move.
   * Return a new object; must not mutate the input.
   */
  reorder?: (item: Item, index: number) => Item;
}

export interface TrackerAPI<Item> {
  items: Item[];
  setAll: (next: Item[]) => void;
  add: (item: Item) => void;
  removeAt: (index: number) => void;
  updateAt: (index: number, patch: Partial<Item>) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
}

/**
 * Manages an ordered list of tracker items. Every mutator returns a new
 * array and reconstructs touched items immutably, then fans the projected
 * payload list out to onChange.
 *
 * The adapter must be stable across renders — define it at module scope
 * or memoize it, otherwise the internal useCallback deps will thrash and
 * defeat downstream memoization.
 *
 * Each mutator closes over the items snapshot from its render. Fire at
 * most one mutation per user event; for chained updates, call setAll with
 * the pre-computed final array.
 */
export function useTracker<Item, Payload>(
  initial: () => Item[],
  onChange: (payload: Payload[]) => void,
  adapter: TrackerAdapter<Item, Payload>,
): TrackerAPI<Item> {
  const [items, setItems] = useState<Item[]>(initial);

  const emit = useCallback(
    (next: Item[]) => {
      setItems(next);
      onChange(next.map(adapter.toPayload));
    },
    [onChange, adapter],
  );

  const renumber = useCallback(
    (arr: Item[]): Item[] =>
      adapter.reorder ? arr.map((item, i) => adapter.reorder!(item, i)) : arr,
    [adapter],
  );

  const setAll = useCallback((next: Item[]) => emit(next), [emit]);

  const add = useCallback(
    (item: Item) => emit([...items, item]),
    [items, emit],
  );

  const removeAt = useCallback(
    (index: number) => {
      emit(renumber(items.filter((_, i) => i !== index)));
    },
    [items, emit, renumber],
  );

  const updateAt = useCallback(
    (index: number, patch: Partial<Item>) => {
      emit(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    },
    [items, emit],
  );

  const swap = useCallback(
    (a: number, b: number) => {
      const next = items.slice();
      [next[a], next[b]] = [next[b], next[a]];
      emit(renumber(next));
    },
    [items, emit, renumber],
  );

  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0) {
        return;
      }
      swap(index - 1, index);
    },
    [swap],
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length - 1) {
        return;
      }
      swap(index, index + 1);
    },
    [items, swap],
  );

  return { items, setAll, add, removeAt, updateAt, moveUp, moveDown };
}
