export interface SimpleOptions {
  transformation: TransformationOptions;
  transformationColumns: string[];
  transformationAggregation: string[];
  columnAliases: Record<string, string>;
}

export enum TransformationOptions {
  TimeSeriesToColumns = 'timeseries-to-columns',
  TimeSeriesToRows = 'timeseries-to-rows',
  TimeSeriesAggreations = 'timeseries-aggregations',
  Annotations = 'annotations',
  Table = 'table',
  JSONData = 'json-data',
}

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
}

export type ColumnSorting = {
  index: number;
  order: ColumnSortingOptions;
};

export enum ColumnStyleType {
  Number = 'number',
  String = 'string',
  Date = 'date',
  Hidden = 'hidden',
}

export enum ColumnStyleColoring {
  Disabled = 'disabled',
  Cell = 'cell',
  Value = 'value',
  Row = 'row',
  RowColumn = 'row-column',
}

export type ColumnStyling = {
  nameOrRegex: string;
  type: ColumnStyleType;
  ignoreNull: boolean;
  colorBy?: ColumnStyleColoring;
  threshold?: string;
  colors?: [string, string, string];
};
