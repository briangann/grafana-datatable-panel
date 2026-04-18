import { useCallback, useEffect, useRef, useState } from 'react';

export interface TrackerAdapter<Item, Payload> {
  /** Extract the externally-visible payload from a tracker item for onChange emission. */
  toPayload: (item: Item) => Payload;
  /**
   * Re-number order fields after add/remove/move.
   * Return a new object; must not mutate the input.
   */
  reorder?: (item: Item, index: number) => Item;
}

export type UpdatePatch<Item> = Partial<Item> | ((prev: Item) => Partial<Item>);

export interface TrackerAPI<Item> {
  items: Item[];
  setAll: (next: Item[]) => void;
  add: (item: Item) => void;
  removeAt: (index: number) => void;
  updateAt: (index: number, patch: UpdatePatch<Item>) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
}

/**
 * Manages an ordered list of tracker items. Mutators use functional
 * setState so they stay stable across renders and compose safely.
 *
 * onChange fires from a post-commit effect, so updates that React
 * schedules but later discards (e.g. unmount mid-event, interrupted
 * transition) do not leak through as phantom emissions.
 *
 * The adapter must be stable across renders — define it at module
 * scope or memoize it. Otherwise commit/renumber identities thrash
 * and defeat downstream memoization.
 */
export function useTracker<Item, Payload>(
  initial: () => Item[],
  onChange: (payload: Payload[]) => void,
  adapter: TrackerAdapter<Item, Payload>,
): TrackerAPI<Item> {
  const [items, setItems] = useState<Item[]>(initial);

  // Ref-latch onChange and adapter so the post-commit effect depends
  // only on `items`; otherwise a caller that passes an unstable
  // onChange would re-fire for every render.
  const onChangeRef = useRef(onChange);
  const adapterRef = useRef(adapter);
  useEffect(() => {
    onChangeRef.current = onChange;
    adapterRef.current = adapter;
  });

  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    onChangeRef.current(items.map(adapterRef.current.toPayload));
  }, [items]);

  const renumber = useCallback(
    (arr: Item[]): Item[] =>
      adapter.reorder ? arr.map((item, i) => adapter.reorder!(item, i)) : arr,
    [adapter],
  );

  const commit = useCallback(
    (updater: (prev: Item[]) => Item[]) =>
      setItems((prev) => {
        const next = updater(prev);
        return next === prev ? prev : next;
      }),
    [],
  );

  const setAll = useCallback((next: Item[]) => commit(() => next), [commit]);

  const add = useCallback(
    (item: Item) => commit((prev) => [...prev, item]),
    [commit],
  );

  const removeAt = useCallback(
    (index: number) =>
      commit((prev) => renumber(prev.filter((_, i) => i !== index))),
    [commit, renumber],
  );

  const updateAt = useCallback(
    (index: number, patch: UpdatePatch<Item>) =>
      commit((prev) => {
        const target = prev[index];
        if (target === undefined) {
          return prev;
        }
        const resolved = typeof patch === 'function' ? patch(target) : patch;
        if (Object.keys(resolved).length === 0) {
          return prev;
        }
        return prev.map((curr, i) =>
          i === index ? { ...curr, ...resolved } : curr,
        );
      }),
    [commit],
  );

  const moveUp = useCallback(
    (index: number) =>
      commit((prev) => {
        if (index <= 0 || index >= prev.length) {
          return prev;
        }
        const next = prev.slice();
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        return renumber(next);
      }),
    [commit, renumber],
  );

  const moveDown = useCallback(
    (index: number) =>
      commit((prev) => {
        if (index < 0 || index >= prev.length - 1) {
          return prev;
        }
        const next = prev.slice();
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        return renumber(next);
      }),
    [commit, renumber],
  );

  return { items, setAll, add, removeAt, updateAt, moveUp, moveDown };
}
