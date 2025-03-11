import { DataFrame, DataTransformerConfig, DataTransformerID, transformDataFrame } from '@grafana/data';
import { lastValueFrom } from 'rxjs';
import { TransformationOptions } from 'types';

export const transformationIDMapping = {
  [TransformationOptions.TimeSeriesToColumns]: DataTransformerID.joinByField,
  [TransformationOptions.TimeSeriesToRows]: DataTransformerID.seriesToRows,
  [TransformationOptions.Table]: DataTransformerID.timeSeriesTable,
};

export function transformData(
  data: DataFrame[],
  transformation: keyof typeof transformationIDMapping,
  options: DataTransformerConfig['options'] = {}
): Promise<DataFrame[]> {
  const transformationID = transformationIDMapping[transformation];
  // TODO: fix this
  // @ts-ignore
  return lastValueFrom(
    // @ts-ignore
    transformDataFrame(
      [
        {
          id: transformationID,
          options,
        },
      ],
      data
    )
  );
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
