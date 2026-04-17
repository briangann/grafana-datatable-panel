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
 * Manages an ordered list of tracker items. Mutators use functional
 * setState so they stay stable across renders and see the freshest
 * state — two mutator calls in the same event compose correctly.
 *
 * Updaters must be pure: return `prev` unchanged to no-op, or a new
 * array to commit. onChange fires once per commit, outside setState,
 * so StrictMode's double-invoke of the updater does not double-emit.
 *
 * The adapter must be stable across renders — define it at module
 * scope or memoize it, otherwise commit/renumber identities thrash
 * and defeat downstream memoization.
 */
export function useTracker<Item, Payload>(
  initial: () => Item[],
  onChange: (payload: Payload[]) => void,
  adapter: TrackerAdapter<Item, Payload>,
): TrackerAPI<Item> {
  const [items, setItems] = useState<Item[]>(initial);

  const renumber = useCallback(
    (arr: Item[]): Item[] =>
      adapter.reorder ? arr.map((item, i) => adapter.reorder!(item, i)) : arr,
    [adapter],
  );

  const commit = useCallback(
    (updater: (prev: Item[]) => Item[]) => {
      let committed: Item[] | null = null;
      setItems((prev) => {
        const next = updater(prev);
        if (next === prev) {
          return prev;
        }
        committed = next;
        return next;
      });
      if (committed !== null) {
        onChange((committed as Item[]).map(adapter.toPayload));
      }
    },
    [onChange, adapter],
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
    (index: number, patch: Partial<Item>) =>
      commit((prev) =>
        prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
      ),
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
