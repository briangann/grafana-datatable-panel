import { PanelModel } from '@grafana/data';

import {
  ColumnAliasField,
  ColumnSorting,
  ColumnSortingOptions,
  ColumnStyling,
  ColumnWidthHint,
  DatatableOptions,
  DatatablePagingType,
  TransformationOptions
} from './types';

interface AngularDatatableOptions {
  alignNumbersToRightEnabled?: boolean;
  columnAliases?: any[];
  columnFiltersEnabled?: boolean,
  columnWidthHints?: any;
  columns?: any[];
  compactRowsEnabled?: boolean;
  datatablePagingType?: string;
  datatableTheme?: string;
  // datatableTheme - not used (delete from config if present)
  emptyData?: boolean;
  fontSize?: string;
  hoverEnabled?: boolean;
  infoEnabled?: boolean;
  lengthChangeEnabled?: boolean;
  orderColumnEnabled?: boolean;
  pagingTypes?: any[];
  rowNumbersEnabled?: boolean;
  rowsPerPage?: number;
  scroll?: boolean;
  scrollHeight?: string;
  searchEnabled?: boolean;
  searchHighlightingEnabled?: boolean;
  showCellBorders?: boolean;
  showRowBorders?: boolean,
  sort?: any;
  sortByColumns?: any;
  sortByColumnsData?: any;
  stripedRowsEnabled?: boolean;
  styles?: any;
  themes?: any;
  themeOptions?: any;
  transform?: any;
}

/**
 * This is called when the panel is imported or reloaded
 */
export const DatatablePanelMigrationHandler = (panel: PanelModel<DatatableOptions>): Partial<DatatableOptions> => {
  // an angular panel will have the property 'datatableTheme` defined, trigger migration if it exists
  // @ts-ignore
  if (!panel.datatableTheme) {
    // not angular, just return the options if currently set
    if (!panel.options) {
      // This happens on the first load or when migrating from angular
      return {} as any;
    }
    // have settings, return them unchanged
    return panel.options;
  }
  // @ts-ignore
  const newDefaults = migrateDefaults(panel);
  let options = newDefaults;

  // clean up undefined
  // @ts-ignore
  Object.keys(panel).forEach((key) => (panel[key] === undefined ? delete panel[key] : {}));
  // @ts-ignore
  Object.keys(options).forEach((key) => (options[key] === undefined ? delete options[key] : {}));

  return options;
};


export const migrateDefaults = (angular: AngularDatatableOptions) => {
  let options: DatatableOptions = {
    alignNumbersToRightEnabled: false,
    columnAliases: [],
    columnFiltersEnabled: false,
    columnWidthHints: [],
    columns: [],
    compactRowsEnabled: true,
    datatablePagingType: DatatablePagingType.FULL,
    emptyDataEnabled: true,
    emptyDataText: 'No Data',
    fontSizePercent: '',
    hoverEnabled: false,
    infoEnabled: false,
    lengthChangeEnabled: false,
    orderColumnEnabled: false,
    rowNumbersEnabled: false,
    rowsPerPage: 0,
    scroll: false,
    searchEnabled: false,
    searchHighlightingEnabled: false,
    showCellBordersEnabled: false,
    showRowBordersEnabled: false,
    sortByColumns: [],
    stripedRowsEnabled: false,
    columnStyles: [],
    transformation: TransformationOptions.TimeSeriesToColumns,
    transformationAggregation: '',
    transformationColumns: [],
    wrapToFitEnabled: true,
  };

  if (angular.alignNumbersToRightEnabled !== undefined) {
    options.alignNumbersToRightEnabled = angular.alignNumbersToRightEnabled;
    delete angular.alignNumbersToRightEnabled;
  }
  if (angular.datatableTheme !== undefined) {
    delete angular.datatableTheme;
  }

  if (angular.compactRowsEnabled !== undefined) {
    options.compactRowsEnabled = angular.compactRowsEnabled;
    delete angular.compactRowsEnabled;
  }

  if (angular.columnAliases !== undefined) {
    options.columnAliases = migrateColumnAliases(angular.columnAliases);
    delete angular.columnAliases;
  }

  if (angular.columnFiltersEnabled !== undefined) {
    options.columnFiltersEnabled = angular.columnFiltersEnabled;
    delete angular.columnFiltersEnabled;
  }

  if (angular.columnWidthHints !== undefined) {
    options.columnWidthHints = migrateColumnWidthHints(angular.columnWidthHints);
    delete angular.columnWidthHints;
  }

  if (angular.columns !== undefined) {
    const migratedColumns: string[] = [];
    for (let index = 0; index < angular.columns.length; index++) {
      migratedColumns.push(angular.columns[index].text);
    }
    delete angular.columns;
  }

  if (angular.compactRowsEnabled !== undefined) {
    options.compactRowsEnabled = angular.compactRowsEnabled;
    delete angular.compactRowsEnabled;
  }

  if (angular.datatablePagingType !== undefined) {
    options.datatablePagingType = migratePagingType(angular.datatablePagingType);
    delete angular.datatablePagingType;
  }

  // theme not used
  if (angular.datatableTheme !== undefined) {
    delete angular.datatableTheme;
  }

  if (angular.emptyData !== undefined) {
    options.emptyDataEnabled = angular.emptyData;
    delete angular.emptyData;
  }

  if (angular.fontSize !== undefined) {
    options.fontSizePercent = angular.fontSize;
    delete angular.fontSize;
  }
  if (angular.hoverEnabled !== undefined) {
    options.hoverEnabled = angular.hoverEnabled;
    delete angular.hoverEnabled;
  }
  if (angular.infoEnabled !== undefined) {
    options.infoEnabled = angular.infoEnabled;
    delete angular.infoEnabled;
  }
  if (angular.lengthChangeEnabled !== undefined) {
    options.lengthChangeEnabled = angular.lengthChangeEnabled;
    delete angular.lengthChangeEnabled;
  }
  if (angular.orderColumnEnabled !== undefined) {
    options.orderColumnEnabled = angular.orderColumnEnabled;
    delete angular.orderColumnEnabled;
  }

  if (angular.pagingTypes !== undefined) {
    delete angular.pagingTypes;
  }

  if (angular.rowNumbersEnabled !== undefined) {
    options.rowNumbersEnabled = angular.rowNumbersEnabled;
    delete angular.rowNumbersEnabled;
  }
  if (angular.rowsPerPage !== undefined) {
    options.rowsPerPage = angular.rowsPerPage;
    delete angular.rowsPerPage;
  }
  if (angular.scroll !== undefined) {
    options.scroll = angular.scroll;
    delete angular.scroll;
  }

  // not used
  if (angular.scrollHeight) {
    delete angular.scrollHeight;
  }

  if (angular.searchEnabled !== undefined) {
    options.searchEnabled = angular.searchEnabled;
    delete angular.searchEnabled;
  }
  if (angular.searchHighlightingEnabled !== undefined) {
    options.searchHighlightingEnabled = angular.searchHighlightingEnabled;
    delete angular.searchHighlightingEnabled;
  }

  if (angular.showCellBorders !== undefined) {
    options.showCellBordersEnabled = angular.showCellBorders;
    delete angular.showCellBorders;
  }

  if (angular.showRowBorders !== undefined) {
    options.showRowBordersEnabled = angular.showRowBorders;
    delete angular.showRowBorders;
  }

  // not used, this is a default sort by column 0 and descending
  if (angular.sort !== undefined) {
    delete angular.sort;
  }
  if (angular.sortByColumns !== undefined) {
    options.sortByColumns = migrateSortByColumns(angular.sortByColumns);
    delete angular.sortByColumns;
  }

  // this is constructed at runtime, should not have been in the config
  if (angular.sortByColumnsData !== undefined) {
    delete angular.sortByColumnsData;
  }

  if (angular.stripedRowsEnabled !== undefined) {
    options.stripedRowsEnabled = angular.stripedRowsEnabled;
    delete angular.stripedRowsEnabled;
  }

  if (angular.styles !== undefined) {
    options.columnStyles = migrateStyles(angular.styles);
    delete angular.styles;
  }
  // not used
  if (angular.themeOptions !== undefined) {
    delete angular.themeOptions;
  }
  if (angular.themes !== undefined) {
    delete angular.themes;
  }

  if (angular.transform !== undefined) {
    options.transformation = migrateTransform(angular.transform);
    delete angular.transform;
  }
  return options;
};

const migrateColumnAliases = (aliases: any[]): ColumnAliasField[] => {
  const migratedAliases = [] as ColumnAliasField[];
  for (let index = 0; index < aliases.length; index++) {
    const element = aliases[index];
    const anAlias: ColumnAliasField = {
      name: element.name,
      alias: element.alias,
    };
    migratedAliases.push(anAlias);
  }
  return migratedAliases;
};

const migrateColumnWidthHints = (widthHints: any[]): ColumnWidthHint[] => {
  const migratedColumnWidthHints = [] as ColumnWidthHint[];
  for (let index = 0; index < widthHints.length; index++) {
    const element = widthHints[index];
    const aHint: ColumnWidthHint = {
      name: element.name,
      width: element.width,
    };
    migratedColumnWidthHints.push(aHint);
  }
  return migratedColumnWidthHints;
};

const migratePagingType = (pagingType: string): DatatablePagingType => {
  let migratedPagingType = DatatablePagingType.SIMPLE_NUMBERS;
  switch (pagingType) {
    case DatatablePagingType.FIRST_LAST_NUMBERS:
      migratedPagingType = DatatablePagingType.FIRST_LAST_NUMBERS;
      break;
    case DatatablePagingType.FULL:
      migratedPagingType = DatatablePagingType.FULL;
      break;
    case DatatablePagingType.FULL_NUMBERS:
      migratedPagingType = DatatablePagingType.FULL_NUMBERS;
      break;
    case DatatablePagingType.NUMBERS:
      migratedPagingType = DatatablePagingType.NUMBERS;
      break;
    case DatatablePagingType.SIMPLE:
      migratedPagingType = DatatablePagingType.SIMPLE;
      break;
    case DatatablePagingType.SIMPLE_NUMBERS:
      migratedPagingType = DatatablePagingType.SIMPLE_NUMBERS;
      break;
    default:
      migratedPagingType = DatatablePagingType.SIMPLE_NUMBERS;
      break;
  }
  return migratedPagingType;
};


const migrateSortByColumns = (sortByColumns: any[]): ColumnSorting[] => {
  const migrated = [] as ColumnSorting[];
  for (let index = 0; index < sortByColumns.length; index++) {
    const element = sortByColumns[index];
    if (element.col !== undefined && element.order !== undefined) {
      const item: ColumnSorting = {
        index: element.col,
        order: element.desc ? ColumnSortingOptions.Descending : ColumnSortingOptions.Ascending,
      };
      migrated.push(item);
    }
  }
  return migrated;
};

const migrateStyles = (styles: any[]): ColumnStyling[] => {
  const migrated = [] as ColumnStyling[];
  for (let index = 0; index < styles.length; index++) {
    const element = styles[index];
    const item: ColumnStyling = {
      colorBy: element.colorMode,
      colors: element.colors,
      dateFormat: element.dateFormat,
      decimals: element.decimals,
      mappingType: element.mappingType,
      nameOrRegex: element.pattern,
      thresholds: element.thresholds,
      type: element.type,
      unit: element.unit,
      ignoreNull: false
    };
    migrated.push(item);
  }
  return migrated;
};

const migrateTransform = (transform: string): TransformationOptions => {
  let migrated = TransformationOptions.TimeSeriesToColumns;
  switch (transform) {
    case 'timeseries_aggregations':
      migrated = TransformationOptions.TimeSeriesAggregations;
      break;
    case 'timeseries_to_columns':
      migrated = TransformationOptions.TimeSeriesToColumns;
      break;
    case 'timeseries_to_rows':
      migrated = TransformationOptions.TimeSeriesToRows;
      break;
    case 'doc':
      migrated = TransformationOptions.Annotations;
      break;
    case 'table':
      migrated = TransformationOptions.Table;
      break;
    case 'json':
      migrated = TransformationOptions.JSONData;
      break;
    default:
      migrated = TransformationOptions.TimeSeriesToColumns;
      break;
  }
  return migrated;
};
