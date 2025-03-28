import { DataFrame, DataTransformerConfig, DataTransformerID, transformDataFrame } from '@grafana/data';
import { lastValueFrom } from 'rxjs';
import { AggregationType, TransformationOptions } from 'types';


export const GetDataTransformerID = (option: TransformationOptions) => {
  switch (option) {
    case TransformationOptions.JSONData:
      return DataTransformerID.joinByField;
    case TransformationOptions.Table:
      return DataTransformerID.merge;
    case TransformationOptions.TimeSeriesAggregations:
      return DataTransformerID.reduce;
    case TransformationOptions.TimeSeriesToColumns:
      return DataTransformerID.joinByField;
    case TransformationOptions.TimeSeriesToRows:
      return DataTransformerID.seriesToRows;
    default:
      return DataTransformerID.joinByField;
  }
}

export async function transformData(
  data: DataFrame[],
  transformation: DataTransformerID,
  aggregations:  AggregationType[],
  options: DataTransformerConfig['options'] = {}
): Promise<DataFrame[]> {

  if (transformation === DataTransformerID.reduce) {
    options.reducers = aggregations; //.map(((anAggregation) => anAggregation.value));
  }
  const transformConfig = {
    id: transformation,
    options: options,
  };
  const transformedData = transformDataFrame([transformConfig], data);
  // TODO: fix this ignore, it works but should not be required
  // @ts-ignore
  return await lastValueFrom(transformedData);
}

export function getDataFrameFields(dataFrames: DataFrame[]): string[] {
  return dataFrames.reduce<string[]>((acc, df) => {
    df.fields.map((field) => {
      if (!acc.includes(field.name)) {
        acc.push(field.name);
      }
    });
    return acc;
  }, []);
}
