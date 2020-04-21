import { transformers } from './transformers';
import { TimeSeries } from './__mocks__/grafana/app/core/time_series2';

describe('Transformers', () => {
  const time = new Date().getTime();
  let aSeries: TimeSeries;
  aSeries = new TimeSeries({
    datapoints: [
      [200, time],
      [101, time + 1],
      [555, time + 2],
    ],
    alias: 'A-series',
    seriesName: 'A-series',
    operatorName: 'current',
  });
  aSeries.stats = {
    avg: 285,
    current: 200,
  };
  aSeries.value = 200;
  aSeries.thresholds = [];
  aSeries.thresholds.push({
    value: 180,
    state: 1,
    color: 'yellow',
  });
  aSeries.thresholds.push({
    value: 200,
    state: 2,
    color: 'red',
  });
  it('aSeries should be defined', () => {
    expect(aSeries).toBeDefined();
  });
  it('description should match', () => {
    const desc = transformers.timeseries_to_rows.description;
    expect(desc).toEqual('Time series to rows');
  });
});
