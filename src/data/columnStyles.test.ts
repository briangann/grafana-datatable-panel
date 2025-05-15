/**
 * Tests for Column Styling
 */

import { ColumnStyleItemType } from 'components/options/columnstyles/types';
import { ApplyColumnStyles } from './columnStyles';
import { DTColumnType } from './types';

describe('Column Styles', () => {
  const columns: DTColumnType[] = [
    {
      title: 'time',
      data: '123',
      type: 'time',
      className: '',
      columnStyle: null,
      visible: true,
    }
  ];
  const columnStyles: ColumnStyleItemType[] = [
    {
      label: 'Style-0',
      nameOrRegex: 'time',
      alias: '',
      thresholds: [],
      colors: [],
      unitFormat: '',
      decimals: '',
      scaledDecimals: null,
      enabled: true,
      clickThrough: '',
      clickThroughSanitize: true,
      clickThroughOpenNewTab: true,
      clickThroughCustomTargetEnabled: false,
      clickThroughCustomTarget: '',
      order: 0,
      ignoreNullValues: false,
      styleItemType: '',
      splitByPattern: '',
    }
  ];
  describe('Applies Time style', () => {
    it('returns time style', () => {
      ApplyColumnStyles(columns, columnStyles);
      expect(columns[0].columnStyle).toEqual(columnStyles[0]);
    });
  });
});
