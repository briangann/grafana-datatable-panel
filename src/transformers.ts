import _ from 'lodash';
import flatten from 'grafana/app/core/utils/flatten';
import TimeSeries from 'grafana/app/core/time_series2';
import TableModel from 'grafana/app/core/table_model';

const transformers: any = {};

transformers.timeseries_to_rows = {
  description: 'Time series to rows',
  getColumns: (data: any) => {
    return [];
  },
  transform: (data: any, panel: any, model: any) => {
    model.columns = [{ text: 'Time', type: 'date' }, { text: 'Metric', type: 'string' }, { text: 'Value', type: 'num' }];

    for (let i = 0; i < data.length; i++) {
      const series = data[i];
      for (let y = 0; y < series.datapoints.length; y++) {
        const dp = series.datapoints[y];
        model.rows.push([dp[1], series.target, dp[0]]);
      }
    }
  },
};

transformers.timeseries_to_columns = {
  description: 'Time series to columns',
  getColumns: (data: any) => {
    // get columns from data
    let columns: any[] = [];
    if (!data) {
      return columns;
    }
    for (let i = 0; i < data.length; i++) {
      if (data[i].alias) {
        columns.push({text: data[i].alias});
      } else {
        columns.push({text: data[i].target});
      }
    }
    return columns;
  },
  transform: (data: any, panel: any, model: any) => {
    model.columns.push({ text: 'Time', type: 'date' });

    // group by time
    const points: any = {};

    for (let i = 0; i < data.length; i++) {
      const series = data[i];
      model.columns.push({ text: series.target, type: 'num' });

      for (let y = 0; y < series.datapoints.length; y++) {
        const dp = series.datapoints[y];
        const timeKey = dp[1].toString();

        if (!points[timeKey]) {
          points[timeKey] = { time: dp[1] };
          points[timeKey][i] = dp[0];
        } else {
          points[timeKey][i] = dp[0];
        }
      }
    }

    for (const time in points) {
      const point = points[time];
      const values = [point.time];

      for (let i = 0; i < data.length; i++) {
        const value = point[i];
        values.push(value);
      }

      model.rows.push(values);
    }
  },
};

transformers.timeseries_aggregations = {
  description: 'Time series aggregations',
  getColumns: () => {
    return [
      { text: 'Avg', value: 'avg' },
      { text: 'Min', value: 'min' },
      { text: 'Max', value: 'max' },
      { text: 'Total', value: 'total' },
      { text: 'Current', value: 'current' },
      { text: 'Count', value: 'count' },
    ];
  },
  transform: (data: any, panel: any, model: any) => {
    let i, y;
    model.columns.push({ text: 'Metric' });

    if (panel.columns.length === 0) {
      panel.columns.push({ text: 'Avg', value: 'avg' });
    }

    for (i = 0; i < panel.columns.length; i++) {
      model.columns.push({ text: panel.columns[i].text });
    }

    for (i = 0; i < data.length; i++) {
      const series = new TimeSeries({
        datapoints: data[i].datapoints,
        alias: data[i].target,
      });

      series.getFlotPairs('connected');
      const cells = [series.alias];

      for (y = 0; y < panel.columns.length; y++) {
        cells.push(series.stats[panel.columns[y].value]);
      }

      model.rows.push(cells);
    }
  },
};

transformers.annotations = {
  description: 'Annotations',
  getColumns: () => {
    return [];
  },
  transform: (data: any, panel: any, model: any) => {
    model.columns.push({ text: 'Time', type: 'date' });
    model.columns.push({ text: 'Title' });
    model.columns.push({ text: 'Text' });
    model.columns.push({ text: 'Tags' });

    if (!data || data.length === 0) {
      return;
    }

    for (let i = 0; i < data.length; i++) {
      const evt = data[i];
      model.rows.push([evt.min, evt.title, evt.text, evt.tags]);
    }
  },
};

transformers.table = {
  description: 'Table',
  getColumns: (data: any) => {
    if (!data || data.length === 0) {
      return [];
    }
    return; // TODO: fix?
  },
  transform: (data: any, panel: any, model: any) => {
    if (!data || data.length === 0) {
      return;
    }

    if (data[0] === undefined) {
      throw { message: 'Query result is not in table format, try using another transform.' };
    }
    if (data[0].type === undefined) {
      throw { message: 'Query result is not in table format, try using another transform.' };
    }
    if (data[0].type !== 'table') {
      throw { message: 'Query result is not in table format, try using another transform.' };
    }
    model.columns = data[0].columns;
    model.rows = data[0].rows;
  },
};

transformers.json = {
  description: 'JSON Data',
  getColumns: (data: any) => {
    if (!data || data.length === 0) {
      return [];
    }

    const names: any = {};
    for (let i = 0; i < data.length; i++) {
      const series = data[i];
      if (series.type !== 'docs') {
        continue;
      }

      // only look at 100 docs
      const maxDocs = Math.min(series.datapoints.length, 100);
      for (let y = 0; y < maxDocs; y++) {
        const doc = series.datapoints[y];
        const flattened = flatten(doc, null);
        for (const propName in flattened) {
          names[propName] = true;
        }
      }
    }

    return _.map(names, (value, key) => {
      return { text: key, value: key };
    });
  },
  transform: (data: any, panel: any, model: any) => {
    let i, y, z;
    for (i = 0; i < panel.columns.length; i++) {
      model.columns.push({ text: panel.columns[i].text });
    }

    if (model.columns.length === 0) {
      model.columns.push({ text: 'JSON' });
    }

    for (i = 0; i < data.length; i++) {
      const series = data[i];

      for (y = 0; y < series.datapoints.length; y++) {
        const dp = series.datapoints[y];
        const values = [];

        if (_.isObject(dp) && panel.columns.length > 0) {
          const flattened = flatten(dp, null);
          for (z = 0; z < panel.columns.length; z++) {
            values.push(flattened[panel.columns[z].value]);
          }
        } else {
          values.push(JSON.stringify(dp));
        }

        model.rows.push(values);
      }
    }
  },
};

function transformDataToTable(data: any, panel: any) {
  const model = new TableModel();

  if (!data || data.length === 0) {
    return model;
  }

  const transformer = transformers[panel.transform];
  if (!transformer) {
    throw { message: 'Transformer ' + panel.transformer + ' not found' };
  }

  transformer.transform(data, panel, model);
  return model;
}

export { transformers, transformDataToTable };
