import { buildSearchBarLayout } from './buildSearchBarLayout';

describe('buildSearchBarLayout', () => {
  describe('when search is disabled', () => {
    it.each(['topStart', 'topEnd', 'bottomStart', 'bottomEnd'] as const)(
      'only nulls the top-end search slot so pageLength/info/paging defaults survive (%s)',
      (position) => {
        expect(buildSearchBarLayout(false, position)).toEqual({ topEnd: null });
      },
    );
  });

  describe('when search is enabled', () => {
    it('places search at topStart, nulls topEnd, leaves bottom slots default', () => {
      expect(buildSearchBarLayout(true, 'topStart')).toEqual({
        topStart: 'search',
        topEnd: null,
      });
    });

    it('places search at topEnd and leaves topStart/bottom slots default', () => {
      expect(buildSearchBarLayout(true, 'topEnd')).toEqual({ topEnd: 'search' });
    });

    it('places search at bottomStart, nulls topEnd, displaces info to bottomEnd', () => {
      expect(buildSearchBarLayout(true, 'bottomStart')).toEqual({
        topEnd: null,
        bottomStart: 'search',
        bottomEnd: ['info', 'paging'],
      });
    });

    it('places search at bottomEnd, nulls topEnd, displaces paging to bottomStart', () => {
      expect(buildSearchBarLayout(true, 'bottomEnd')).toEqual({
        topEnd: null,
        bottomStart: ['paging', 'info'],
        bottomEnd: 'search',
      });
    });
  });
});
