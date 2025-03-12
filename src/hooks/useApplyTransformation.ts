import { DataFrame } from '@grafana/data';
import React from 'react';
import { transformData } from 'data/transformations';
import { TransformationOptions } from 'types';

export const useApplyTransformation = (dataSeries: DataFrame[]) => {
  const [dataFrames, setDataFrames] = React.useState<DataFrame[] | undefined>();

  React.useEffect(() => {
    async function fetchData() {
      //TODO: Use the actual panel option instead of this hardcoded one
      const rows = await transformData(dataSeries, TransformationOptions.TimeSeriesToColumns);
      setDataFrames(rows);
    }
    fetchData();
  }, [dataSeries]);

  return dataFrames;
};
