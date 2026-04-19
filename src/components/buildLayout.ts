import type { Config } from 'datatables.net-dt';
import type { SearchPosition } from '../types';

export function buildLayout(
  enabled: boolean,
  position: SearchPosition,
): Config['layout'] {
  if (!enabled) {
    return { topStart: null, topEnd: null };
  }

  const layout: Config['layout'] = {
    topStart: null,
    topEnd: null,
    bottomStart: 'info',
    bottomEnd: 'paging',
  };

  switch (position) {
    case 'topStart':
      layout.topStart = 'search';
      break;
    case 'topEnd':
      layout.topEnd = 'search';
      break;
    case 'bottomStart':
      layout.bottomStart = 'search';
      layout.bottomEnd = ['info', 'paging'];
      break;
    case 'bottomEnd':
      layout.bottomEnd = 'search';
      layout.bottomStart = ['paging', 'info'];
      break;
  }

  return layout;
}
