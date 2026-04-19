import type { Config } from 'datatables.net-dt';
import type { SearchPosition } from 'types';

export function buildSearchBarLayout(
  enabled: boolean,
  position: SearchPosition,
): Config['layout'] {
  if (!enabled) {
    return { topEnd: null };
  }

  switch (position) {
    case 'topStart':
      return { topStart: 'search', topEnd: null };
    case 'topEnd':
      return { topEnd: 'search' };
    case 'bottomStart':
      return {
        topEnd: null,
        bottomStart: 'search',
        bottomEnd: ['info', 'paging'],
      };
    case 'bottomEnd':
      return {
        topEnd: null,
        bottomStart: ['paging', 'info'],
        bottomEnd: 'search',
      };
    default: {
      const _exhaustive: never = position;
      throw new Error(`unhandled SearchPosition: ${_exhaustive}`);
    }
  }
}
