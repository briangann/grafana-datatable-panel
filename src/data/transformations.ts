import { DataFrame, DataTransformerConfig, DataTransformerID, transformDataFrame } from '@grafana/data';
import { lastValueFrom } from 'rxjs';
import { TransformationOptions } from 'types';


export const GetDataTransformerID = (option: TransformationOptions) => {
  switch (option) {
    case TransformationOptions.TimeSeriesToColumns:
      return DataTransformerID.joinByField;
    case TransformationOptions.TimeSeriesToRows:
      return DataTransformerID.seriesToRows;
    case TransformationOptions.Table:
      return DataTransformerID.timeSeriesTable;
    default:
      return DataTransformerID.joinByField;
  }
}

export async function transformData(
  data: DataFrame[],
  transformation: DataTransformerID,
  options: DataTransformerConfig['options'] = {}
): Promise<DataFrame[]> {
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
