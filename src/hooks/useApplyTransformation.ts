import { DataFrame, DataTransformerID } from '@grafana/data';
import React from 'react';
import { transformData } from 'data/transformations';
import { AggregationType } from 'types';

export const useApplyTransformation = (dataSeries: DataFrame[], transformID: DataTransformerID, aggregations: AggregationType[]) => {
  const [dataFrames, setDataFrames] = React.useState<DataFrame[] | undefined>();

  React.useEffect(() => {
    async function fetchData() {
      const rows = await transformData(dataSeries, transformID, aggregations);
      setDataFrames(rows);
    }
    fetchData();
  }, [dataSeries, transformID, aggregations]);

  return dataFrames;
};
