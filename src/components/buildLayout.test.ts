import { buildLayout } from './buildLayout';

describe('buildLayout', () => {
  describe('when search is disabled', () => {
    it.each(['topStart', 'topEnd', 'bottomStart', 'bottomEnd'] as const)(
      'only nulls the top-end search slot so pageLength/info/paging defaults survive (%s)',
      (position) => {
        expect(buildLayout(false, position)).toEqual({ topEnd: null });
      },
    );
  });

  describe('when search is enabled', () => {
    it('places search at topStart, nulls topEnd, leaves bottom slots default', () => {
      expect(buildLayout(true, 'topStart')).toEqual({
        topStart: 'search',
        topEnd: null,
      });
    });

    it('places search at topEnd and leaves topStart/bottom slots default', () => {
      expect(buildLayout(true, 'topEnd')).toEqual({ topEnd: 'search' });
    });

    it('places search at bottomStart, nulls topEnd, displaces info to bottomEnd', () => {
      expect(buildLayout(true, 'bottomStart')).toEqual({
        topEnd: null,
        bottomStart: 'search',
        bottomEnd: ['info', 'paging'],
      });
    });

    it('places search at bottomEnd, nulls topEnd, displaces paging to bottomStart', () => {
      expect(buildLayout(true, 'bottomEnd')).toEqual({
        topEnd: null,
        bottomStart: ['paging', 'info'],
        bottomEnd: 'search',
      });
    });
  });
});
