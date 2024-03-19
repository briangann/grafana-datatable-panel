import { PanelOptionsEditorBuilder, StandardEditorContext } from '@grafana/data';
import { SimpleOptions } from 'types';
import { ColumnAliasesEditor } from './ColumnAliases';
import { ColumnWidthHints } from './ColumnWidthHints';
import { ColumnSortingEditor } from './ColumnSorting';

export async function optionsBuilder(
  builder: PanelOptionsEditorBuilder<SimpleOptions>,
  builderContext: StandardEditorContext<SimpleOptions>
) {
  builder.addSelect({
    category: ['Data'],
    path: 'transformation',
    name: 'Table Transform',
    description: 'How to transform the data coming from the datasource',
    defaultValue: 'timeseries-to-columns',
    settings: {
      options: [
        { value: 'timeseries-to-columns', label: 'Timeseries to Columns' },
        { value: 'timeseries-to-rows', label: 'Timeseries to Rows' },
        { value: 'timeseries-aggregations', label: 'Timeseries Aggregations' },
        { value: 'annotations', label: 'Annotations' },
      ],
    },
  });

  builder.addFieldNamePicker({
    category: ['Data'],
    path: 'transformationColumns',
    name: 'Columns',
    showIf: (context) => context['transformation'] === 'timeseries-to-columns',
  });

  builder.addMultiSelect({
    category: ['Data'],
    path: 'transformationAggregation',
    name: 'Agregations',
    defaultValue: '',
    showIf: (context) => context['transformation'] === 'timeseries-aggregations',
    settings: {
      options: [
        { value: 'avg', label: 'Average' },
        { value: 'min', label: 'Min' },
        { value: 'max', label: 'Max' },
        { value: 'total', label: 'Total' },
        { value: 'current', label: 'Current' },
        { value: 'count', label: 'Count' },
      ],
    },
  });

  builder.addCustomEditor({
    category: ['Column Aliases'],
    path: 'columnAliases',
    id: 'columnAliases',
    name: 'Column Aliases',
    editor: ColumnAliasesEditor,
  });

  builder.addCustomEditor({
    category: ['Column Width Hints'],
    path: 'columnWidthHints',
    id: 'columnWidthHints',
    name: 'Column Width Hints',
    editor: ColumnWidthHints,
  });

  builder.addCustomEditor({
    category: ['Column Sorting'],
    path: 'columnSorting',
    id: 'columnSorting',
    name: 'Column Sorting',
    editor: ColumnSortingEditor,
  });
}
