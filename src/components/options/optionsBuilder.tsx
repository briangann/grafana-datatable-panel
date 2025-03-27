import { PanelOptionsEditorBuilder, StandardEditorContext } from '@grafana/data';
import { AggregationOptions, AggregationType, ColumnSortingOptions, ColumnStyling, DatatableOptions, DatatablePagingOptions, DatatablePagingType, FontSizes } from 'types';
import { ColumnAliasesEditor } from './ColumnAliasesEditor';
import { ColumnWidthHints } from './ColumnWidthHintsEditor';
import { ColumnSortingEditor } from './ColumnSortingEditor';
import { ColumnStylesEditor } from './columnstyles/ColumnStylesEditor';

export async function optionsBuilder(
  builder: PanelOptionsEditorBuilder<DatatableOptions>,
  builderContext: StandardEditorContext<DatatableOptions>
) {
  builder.addBooleanSwitch({
    name: 'Use Compact Rows',
    path: 'compactRowsEnabled',
    defaultValue: true,
    category: ['Table Options'],
    description: 'Display rows in compact mode'
  });
  builder.addBooleanSwitch({
    name: 'Wrap Row Content',
    path: 'wrapToFitEnabled',
    defaultValue: true,
    category: ['Table Options'],
    description: 'Display content wrapped'
  });
  // Striped Rows
  builder.addBooleanSwitch({
    name: 'Show stripes on Rows',
    path: 'stripedRowsEnabled',
    defaultValue: true,
    category: ['Table Options'],
    description: 'Show stripes on rows'
  });

  builder.addBooleanSwitch({
    name: 'Hover',
    path: 'hoverEnabled',
    defaultValue: true,
    category: ['Table Options'],
    description: "Highlights row on hover (Requires Page Reload on toggle)"
  });
  builder.addBooleanSwitch({
    name: 'Scrolling',
    path: 'scroll',
    defaultValue: true,
    category: ['Table Options'],
    description: 'Scrolling instead of paging'
  });

  // rows per page
  builder.addNumberInput({
    name: 'Rows per Page',
    path: 'rowsPerPage',
    defaultValue: 5,
    settings: {
      min: 5,
      integer: true,
    },
    category: ['Table Options'],
    description: 'Number of rows of data to display',
    showIf: (context) => context['scroll'] === false,
  });
  builder.addBooleanSwitch({
    name: 'Show rows per page selection',
    path: 'lengthChangeEnabled',
    defaultValue: true,
    description: 'Display Length Change Selection',
    category: ['Table Options'],
    showIf: (context) => context['scroll'] === false,
  });

  builder.addBooleanSwitch({
    name: 'Fill Empty Data with Custom Value',
    path: 'emptyDataEnabled',
    description: 'When no data is available for a cell, set a custom value to display',
    defaultValue: true,
    category: ['Table Options'],
  });

  builder.addTextInput({
    name: 'emptyDataText',
    path: 'emptyDataText',
    defaultValue: 'No Data',
    category: ['Table Options'],
    showIf: (context) => context['emptyDataEnabled'] === true,
  });

  // table options

  // rowNumbers
  builder.addBooleanSwitch({
    name: 'Enable Row Numbers',
    path: 'rowNumbersEnabled',
    defaultValue: true,
    category: ['Table Options'],
    description: 'Display Row Numbers in left-most column'
  });

  // rightAlignNumbers
  builder.addBooleanSwitch({
    name: 'Right Align Numbers',
    path: 'alignNumbersToRightEnabled',
    defaultValue: true,
    category: ['Table Options'],
    description: 'Any cell with a numeric value will be aligned to the right'
  });
  // Search Enabled
  // Search Highlighting
  builder.addBooleanSwitch({
    name: 'Allow Searching Within Table',
    path: 'searchEnabled',
    defaultValue: true,
    category: ['Search Options'],
    description: 'Provides search option at top right of table'
  });
  builder.addBooleanSwitch({
    name: 'Highlight Search Results',
    path: 'searchHighlightingEnabled',
    defaultValue: true,
    category: ['Search Options'],
    description: 'Highlight matching text during search'
  });

  builder.addSelect({
    path: 'fontSizePercent',
    name: 'Font Size',
    description: 'Font Size',
    defaultValue: FontSizes[2].value,
    category: ['Visual Options'],
    settings: {
      options: FontSizes,
    },
  });
  // Info Enabled
  builder.addBooleanSwitch({
    name: 'Show Footer Info',
    path: 'infoEnabled',
    defaultValue: true,
    category: ['Visual Options'],
    description: 'Display Showing N of N entries footer'
  });

  builder.addBooleanSwitch({
    name: 'Highlight Order Column',
    path: 'orderColumnEnabled',
    defaultValue: true,
    category: ['Visual Options'],
    description: 'Highlight the column that the table data is currently ordered on',
  });


  // Column Filters
  builder.addBooleanSwitch({
    name: 'Show Column Filters',
    path: 'columnFiltersEnabled',
    defaultValue: false,
    category: ['Visual Options'],
    description: 'Show filter on each column'
  });

  builder.addSelect({
    path: 'datatablePagingType',
    name: 'Paging Type',
    description: 'How the paging buttons are displayed',
    defaultValue: DatatablePagingType.SIMPLE_NUMBERS,
    category: ['Paging'],
    settings: {
      options: DatatablePagingOptions,
    },
    showIf: (context) => context['scroll'] === false,
  });


  builder.addSelect({
    category: ['Data'],
    path: 'transformation',
    name: 'Transform',
    description: 'How to transform the data coming from the datasource.',
    defaultValue: 'timeseries-to-columns',
    settings: {
      options: [
        { value: 'timeseries-to-columns', label: 'Timeseries to Columns' },
        { value: 'timeseries-to-rows', label: 'Timeseries to Rows' },
        { value: 'timeseries-aggregations', label: 'Timeseries Aggregations' },
        { value: 'annotations', label: 'Annotations' },
        { value: 'json-data', label: 'JSON Data' },
        { value: 'table', label: 'Table' },
      ],
    },
  });

  builder.addMultiSelect({
    category: ['Data'],
    path: 'transformationAggregation',
    name: 'Aggregations',
    defaultValue: [
      AggregationType.CURRENT,
    ],
    showIf: (context) => context['transformation'] === 'timeseries-aggregations',
    settings: {
      options: AggregationOptions,
    },
  });

  builder.addCustomEditor({
    category: ['Column Aliases'],
    path: 'columnAliases',
    id: 'columnAliases',
    name: 'Column Aliases',
    defaultValue: [],
    editor: ColumnAliasesEditor,
  });

  builder.addCustomEditor({
    category: ['Column Width Hints'],
    path: 'columnWidthHints',
    id: 'columnWidthHints',
    name: 'Column Width Hints',
    defaultValue: [],
    editor: ColumnWidthHints,
  });

  builder.addCustomEditor({
    category: ['Column Sorting'],
    path: 'columnSorting',
    id: 'columnSorting',
    name: 'Column Sorting',
    defaultValue: [
      { index: 0, order: ColumnSortingOptions.Descending },
    ],
    editor: ColumnSortingEditor,
  });

  builder.addCustomEditor({
    category: ['Column Styles'],
    path: 'columnStylesConfig',
    id: 'columnStylesConfig',
    name: 'Column Styles',
    defaultValue: [] as ColumnStyling[],
    editor: ColumnStylesEditor,
  });


}
