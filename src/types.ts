type SeriesSize = 'sm' | 'md' | 'lg';

export interface SimpleOptions {
  text: string;
  showSeriesCount: boolean;
  seriesCountSize: SeriesSize;
}

export enum TransformationOptions {
  TimeSeriesToColumns = 'timeseries-to-columns',
  TimeSeriesToRows = 'timeseries-to-rows',
  TimeSeriesAggreations = 'timeseries-aggregations',
  Annotations = 'annotations',
  Table = 'table',
  JSONData = 'json-data',
}
