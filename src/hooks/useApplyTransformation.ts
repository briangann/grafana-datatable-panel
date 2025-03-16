import { DataFrame, DataTransformerID } from '@grafana/data';
import React from 'react';
import { transformData } from 'data/transformations';

export const useApplyTransformation = (dataSeries: DataFrame[], transformID: DataTransformerID) => {
  const [dataFrames, setDataFrames] = React.useState<DataFrame[] | undefined>();

  React.useEffect(() => {
    async function fetchData() {
      //TODO: Use the actual panel option instead of this hardcoded one
      //const rows = await transformData(dataSeries, TransformationOptions.TimeSeriesToRows);
      // to columns should be the default, but can be selected

      // this works well for timeseries
      //const rows = await transformData(dataSeries, TransformationOptions.TimeSeriesToColumns);
      //const rows = await transformData(dataSeries, TransformationOptions.TimeSeriesToColumns);
      // map id mapping to DataTransformerID } from '@grafana/data';


      const rows = await transformData(dataSeries, transformID);
      setDataFrames(rows);
    }
    fetchData();
  }, [dataSeries, transformID]);

  return dataFrames;
};
