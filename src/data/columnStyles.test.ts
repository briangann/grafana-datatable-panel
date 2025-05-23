/**
 * Tests for Column Styling
 */

import { ColumnStyleItemType, ColumnStyles } from 'components/options/columnstyles/types';
import { ApplyColumnStyles } from './columnStyles';
import { DTColumnType } from './types';
import { DateFormats } from 'types';

describe('Column Styles', () => {
  const columns: DTColumnType[] = [
    {
      title: 'time',
      data: '123',
      type: 'time',
      className: '',
      columnStyles: [],
      visible: true,
    }
  ];
  const columnStyles: ColumnStyleItemType[] = [
    {
      label: 'Style-0',
      activeStyle: ColumnStyles.METRIC,
      enabled: true,
      nameOrRegex: 'time',
      order: 0,
      metricStyle: {
        alias: '',
        thresholds: [],
        colors: [],
        unitFormat: '',
        decimals: '',
        scaledDecimals: null,
        ignoreNullValues: true,
      },
      stringStyle: {
        clickThrough: '',
        clickThroughSanitize: true,
        clickThroughOpenNewTab: true,
        clickThroughCustomTargetEnabled: false,
        clickThroughCustomTarget: '',
        splitByPattern: '',
      },
      dateStyle: {
        dateFormat: DateFormats[5].value,
      },
      hiddenStyle: {},
    }
  ];
  describe('Applies Time style', () => {
    it('returns time style', () => {
      ApplyColumnStyles(columns, columnStyles);
      expect(columns[0].columnStyles[0]).toEqual(columnStyles[0]);
    });
  });
});
