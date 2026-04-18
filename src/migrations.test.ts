import { PanelModel } from '@grafana/data';

import {
  DatatablePanelMigrationHandler,
  migrateDefaults,
} from './migrations';
import { ColumnAlignment } from 'types';

describe('Datatable -> DatatableV2 migrations', () => {
  it('only migrates old datatable', () => {
    const panel = {} as PanelModel;
    const options = DatatablePanelMigrationHandler(panel);
    expect(options).toEqual({});
  });

  it('migrates old datatable config', () => {
    const panel = {} as PanelModel;
    panel.options = {};
    const options = DatatablePanelMigrationHandler(panel);
    expect(options).toMatchSnapshot();
  });

  it('migrateDefaults seeds alignStringsToRightEnabled=true so string columns stay right-aligned', () => {
    const options = migrateDefaults({});
    expect(options.alignStringsToRightEnabled).toBe(true);
  });

  it('migrateDefaults seeds migrated column styles with align=DEFAULT', () => {
    const options = migrateDefaults({
      styles: [
        {
          pattern: 'A-series',
          type: 'number',
          colors: [],
          thresholds: [],
        },
      ],
    });
    expect(options.columnStylesConfig).toHaveLength(1);
    expect(options.columnStylesConfig[0].align).toBe(ColumnAlignment.DEFAULT);
  });
});
