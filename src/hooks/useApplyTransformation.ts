import { DataFrame, DataTransformerID, transformDataFrame } from '@grafana/data';
import React from 'react';
import { lastValueFrom } from 'rxjs';

export const useApplyTransformation = (dataSeries: DataFrame[]) => {
  const [dataFrames, setDataFrames] = React.useState<DataFrame[] | undefined>();

  React.useEffect(() => {
    async function fetchData() {
      const rows = await lastValueFrom(
        transformDataFrame(
          [
            {
              id: DataTransformerID.joinByField,
              options: {},
            },
          ],
          dataSeries
        )
      );
      setDataFrames(rows);
    }
    fetchData();
  }, [dataSeries]);

  return dataFrames;
};
