import type { Config } from 'datatables.net-dt';
import type { SearchPosition } from 'types';

export function buildSearchBarLayout(
  enabled: boolean,
  position: SearchPosition,
): Config['layout'] {
  if (!enabled) {
    // Only suppress the default search slot; leave topStart (pageLength),
    // bottomStart (info), and bottomEnd (paging) to DataTables' defaults.
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
      return _exhaustive;
    }
  }
}
