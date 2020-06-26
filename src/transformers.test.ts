import { transformers } from './transformers';
import { TimeSeries } from '../tests/__mocks__/grafana/app/core/time_series2';
import TableModel from 'grafana/app/core/table_model';

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
  it('timeseries_to_rows should...', () => {
    const result = transformers.timeseries_to_rows.getColumns();
    expect(result).toEqual([]);
    const data = [] as any;
    const model = new TableModel();
    transformers.timeseries_to_rows.transform(data, null, model);
    expect(model.type).toEqual('table');
  });
  it('timeseries_to_columns should...', () => {
    const result = transformers.timeseries_to_columns.getColumns();
    expect(result).toEqual([]);
    const data = [] as any;
    const model = new TableModel();
    transformers.timeseries_to_columns.transform(data, null, model);
    expect(model.type).toEqual('table');
  });
  it('timeseries_aggregations', () => {
    const result = transformers.timeseries_aggregations.getColumns();
    expect(result.length).toEqual(6);
    const data = [] as any;
    const model = new TableModel();
    model.columns = [];
    const panel = {
      columns: [],
    };
    transformers.timeseries_aggregations.transform(data, panel, model);
    expect(model.type).toEqual('table');
  });
  it('annotations', () => {
    const result = transformers.annotations.getColumns();
    expect(result).toEqual([]);
    const data = [] as any;
    const model = new TableModel();
    transformers.annotations.transform(data, null, model);
    expect(model.type).toEqual('table');
  });
  it('table', () => {
    const result = transformers.table.getColumns();
    expect(result).toEqual([]);
    const data = [] as any;
    const model = new TableModel();
    transformers.table.transform(data, null, model);
    expect(model.type).toEqual('table');
  });
  it('json', () => {
    const result = transformers.json.getColumns();
    expect(result).toEqual([]);
    const data = [] as any;
    const model = new TableModel();
    transformers.table.transform(data, null, model);
    expect(model.type).toEqual('table');
  });
});
