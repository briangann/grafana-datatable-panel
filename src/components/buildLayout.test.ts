import { buildLayout } from './buildLayout';

describe('buildLayout', () => {
  describe('when search is disabled', () => {
    it.each(['topStart', 'topEnd', 'bottomStart', 'bottomEnd'] as const)(
      'returns only the top slots cleared regardless of position (%s)',
      (position) => {
        expect(buildLayout(false, position)).toEqual({
          topStart: null,
          topEnd: null,
        });
      },
    );
  });

  describe('when search is enabled', () => {
    it('places search at topStart and clears topEnd', () => {
      expect(buildLayout(true, 'topStart')).toEqual({
        topStart: 'search',
        topEnd: null,
        bottomStart: 'info',
        bottomEnd: 'paging',
      });
    });

    it('places search at topEnd and clears topStart', () => {
      expect(buildLayout(true, 'topEnd')).toEqual({
        topStart: null,
        topEnd: 'search',
        bottomStart: 'info',
        bottomEnd: 'paging',
      });
    });

    it('places search at bottomStart and displaces info to bottomEnd', () => {
      expect(buildLayout(true, 'bottomStart')).toEqual({
        topStart: null,
        topEnd: null,
        bottomStart: 'search',
        bottomEnd: ['info', 'paging'],
      });
    });

    it('places search at bottomEnd and displaces paging to bottomStart', () => {
      expect(buildLayout(true, 'bottomEnd')).toEqual({
        topStart: null,
        topEnd: null,
        bottomStart: ['paging', 'info'],
        bottomEnd: 'search',
      });
    });
  });
});
