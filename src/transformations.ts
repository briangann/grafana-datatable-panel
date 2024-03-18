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
  return lastValueFrom(
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
