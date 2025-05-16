import { FieldConfigProperty, PanelPlugin } from '@grafana/data';
import { DatatableOptions } from './types';
import { DataTablePanel } from 'components/DataTablePanel';
import { optionsBuilder } from 'components/options/optionsBuilder';
import { DatatablePanelMigrationHandler } from './migrations';

export const plugin = new PanelPlugin<DatatableOptions>(DataTablePanel)
  .setMigrationHandler(DatatablePanelMigrationHandler)
  .useFieldConfig({
    disableStandardOptions: [
      FieldConfigProperty.Color,
      FieldConfigProperty.Decimals,
      FieldConfigProperty.DisplayName,
      // @ts-ignore (workaround for runtime in v10.3 not having this)
      FieldConfigProperty.FieldMinMax,
      FieldConfigProperty.Filterable,
      FieldConfigProperty.Max,
      FieldConfigProperty.Min,
      FieldConfigProperty.Links,
      FieldConfigProperty.NoValue,
      FieldConfigProperty.Thresholds,
      FieldConfigProperty.Unit,
      FieldConfigProperty.Mappings,
    ],
    standardOptions: {},
  })
  .setPanelOptions(optionsBuilder);
