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
