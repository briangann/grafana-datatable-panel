import { PanelModel } from '@grafana/data';

import {
  applyOptionDefaults,
  DatatablePanelMigrationHandler,
  migrateDefaults,
} from './migrations';
import { ColumnAlignment, type DatatableOptions } from 'types';

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

  it('applyOptionDefaults patches alignStringsToRightEnabled=true when missing', () => {
    const options = { columnStylesConfig: [] } as unknown as DatatableOptions;
    const patched = applyOptionDefaults(options);
    expect(patched.alignStringsToRightEnabled).toBe(true);
  });

  it('applyOptionDefaults preserves an explicit alignStringsToRightEnabled=false', () => {
    const options = {
      alignStringsToRightEnabled: false,
      columnStylesConfig: [],
    } as unknown as DatatableOptions;
    const patched = applyOptionDefaults(options);
    expect(patched.alignStringsToRightEnabled).toBe(false);
  });

  it('applyOptionDefaults stamps align=DEFAULT on column styles that are missing it', () => {
    const options = {
      alignStringsToRightEnabled: true,
      columnStylesConfig: [{ label: 'existing' }, { label: 'keeps-align', align: ColumnAlignment.LEFT }],
    } as unknown as DatatableOptions;
    const patched = applyOptionDefaults(options);
    expect(patched.columnStylesConfig[0].align).toBe(ColumnAlignment.DEFAULT);
    expect(patched.columnStylesConfig[1].align).toBe(ColumnAlignment.LEFT);
  });

  it('DatatablePanelMigrationHandler patches React-saved panels via applyOptionDefaults', () => {
    const panel = {
      options: { columnStylesConfig: [{ label: 'existing' }] },
    } as unknown as PanelModel;
    const migrated = DatatablePanelMigrationHandler(panel) as DatatableOptions;
    expect(migrated.alignStringsToRightEnabled).toBe(true);
    expect(migrated.columnStylesConfig[0].align).toBe(ColumnAlignment.DEFAULT);
  });
});
