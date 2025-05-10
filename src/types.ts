import { SelectableValue } from "@grafana/data";
import { ColumnStyleItemType } from "components/options/columnstyles/types";

export interface DatatableOptions {
  alignNumbersToRightEnabled: boolean;
  columnAliases: ColumnAliasField[];
  columnFiltersEnabled: boolean,
  columnWidthHints: ColumnWidthHint[];
  columns: string[];
  compactRowsEnabled: boolean;
  datatablePagingType: DatatablePagingType;
  emptyDataEnabled: boolean;
  emptyDataText: string;
  fontSizePercent: string;
  hoverEnabled: boolean;
  infoEnabled: boolean;
  lengthChangeEnabled: boolean;
  orderColumnEnabled: boolean;
  rowNumbersEnabled: boolean;
  rowsPerPage: number;
  scroll: boolean;
  searchEnabled: boolean;
  searchHighlightingEnabled: boolean;
  columnSorting: ColumnSorting[],
  stripedRowsEnabled: boolean;
  columnStylesConfig: ColumnStyleItemType[];
  transformation: TransformationOptions;
  transformationAggregations: AggregationType[];
  wrapToFitEnabled: boolean;
};

export enum TransformationOptions {
  TimeSeriesToColumns = 'timeseries-to-columns',
  TimeSeriesToRows = 'timeseries-to-rows',
  TimeSeriesAggregations = 'timeseries-aggregations',
  Table = 'table',
  JSONData = 'json-data',
};

export type ColumnAliasField = {
  name: string;
  alias: string;
};

export type ColumnWidthHint = {
  name: string;
  width: string;
};

export enum ColumnSortingOptions {
  Ascending = 'asc',
  Descending = 'desc',
};

export type ColumnSorting = {
  index: number;
  order: ColumnSortingOptions;
};


export enum DatatablePagingType {
  NUMBERS = 'numbers',
  SIMPLE = 'simple',
  SIMPLE_NUMBERS = 'simple_numbers',
  FULL = 'full',
  FULL_NUMBERS = 'full_numbers',
  FIRST_LAST_NUMBERS = 'first_last_numbers',
};

export const DatatablePagingOptions = [
  { value: DatatablePagingType.NUMBERS, label: 'Page number buttons only' },
  { value: DatatablePagingType.SIMPLE, label: 'Previous\' and \'Next\' buttons only' },
  { value: DatatablePagingType.SIMPLE_NUMBERS, label: '\'Previous\' and \'Next\' buttons, plus page numbers' },
  { value: DatatablePagingType.FULL, label: '\'First\', \'Previous\', \'Next\' and \'Last\' button' },
  { value: DatatablePagingType.FULL_NUMBERS, label: '\'First\', \'Previous\', \'Next\' and \'Last\' buttons, plus page numbers' },
  { value: DatatablePagingType.FIRST_LAST_NUMBERS, label: '\'First\' and \'Last\' buttons, plus page numbers' },
];

export enum AggregationType {
  MEAN = 'mean',
  COUNT = 'count',
  DELTA = 'delta',
  DIFF = 'diff',
  DIFF_PERCENT = 'diffperc',
  DISTINCT_COUNT = 'distinctCount',
  MAX = 'max',
  MIN = 'min',
  TOTAL = 'total',
  FIRST = 'first',
  FIRST_NOT_NULL = 'firstNotNull',
  LAST = 'last',
  LAST_NOT_NULL = 'lastNotNull',
  LOG_MIN = 'logmin',
  RANGE = 'range',
  STD_DEV = 'stdDev',
  VARIANCE = 'variance',
};

export const AggregationOptions: SelectableValue[]= [
  { value: AggregationType.MEAN, label: 'Average (Mean)' },
  { value: AggregationType.COUNT, label: 'Count' },
  { value: AggregationType.DELTA, label: 'Delta' },
  { value: AggregationType.DIFF, label: 'Diff' },
  { value: AggregationType.DIFF_PERCENT, label: 'DiffPercent' },
  { value: AggregationType.DISTINCT_COUNT, label: 'Distinct Count' },
  { value: AggregationType.MAX, label: 'Max' },
  { value: AggregationType.MIN, label: 'Min' },
  { value: AggregationType.TOTAL, label: 'Total' },
  { value: AggregationType.FIRST, label: 'First' },
  { value: AggregationType.FIRST_NOT_NULL, label: 'First (Not Null)' },
  { value: AggregationType.LAST, label: 'Last' },
  { value: AggregationType.LAST_NOT_NULL, label: 'Last (Not Null)' },
  { value: AggregationType.LOG_MIN, label: 'Logmin' },
  { value: AggregationType.RANGE, label: 'Range' },
  { value: AggregationType.STD_DEV, label: 'Std Dev' },
  { value: AggregationType.VARIANCE, label: 'Variance' },
];

export enum ColumnStyleType {
  Metric = 'metric',
  String = 'string',
  Date = 'date',
  Hidden = 'hidden',
};

export enum ColumnStyleColoring {
  Disabled = 'disabled',
  Cell = 'cell',
  Value = 'value',
  Row = 'row',
  RowColumn = 'row-column',
};

// Only for numerical data
export const ColorModeOptions = [
  { label: 'Disabled', value: ColumnStyleColoring.Disabled },
  { label: 'Cell', value: ColumnStyleColoring.Cell },
  { label: 'Value', value: ColumnStyleColoring.Value },
  { label: 'Row', value: ColumnStyleColoring.Row },
  { label: 'Row Column', value: ColumnStyleColoring.RowColumn },
];

export type ColumnStyling = {
  nameOrRegex: string;
  type: ColumnStyleType;
  ignoreNull: boolean;
  colorBy?: ColumnStyleColoring;
  dateFormat?: string;
  decimals?: number;
  mappingType?: number;
  thresholds?: string;
  unit?: string
  colors?: [string, string, string];
};

export const FontSizes: SelectableValue[] = [
  { value: '80%', label: '80%' },
  { value: '90%', label: '90%' },
  { value: '100%', label: '100%' },
  { value: '110%', label: '110%' },
  { value: '120%', label: '120%' },
  { value: '130%', label: '130%' },
  { value: '150%', label: '150%' },
  { value: '160%', label: '160%' },
  { value: '180%', label: '180%' },
  { value: '200%', label: '200%' },
  { value: '220%', label: '220%' },
  { value: '250%', label: '250%' },
];

export const DateFormats = [
  { label: 'YYYY-MM-DD HH:mm:ss', value: 'YYYY-MM-DD HH:mm:ss' },
  { label: 'YYYY-MM-DD HH:mm:ss.SSS', value: 'YYYY-MM-DD HH:mm:ss.SSS' },
  { label: 'MM/DD/YY h:mm:ss a', value: 'MM/DD/YY h:mm:ss a' },
  { label: 'MMMM D, YYYY LT', value: 'MMMM D, YYYY LT' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  { label: 'YYYY-MM-DDTHH:mm:ssZ', value: 'YYYY-MM-DDTHH:mm:ssZ' },
];
