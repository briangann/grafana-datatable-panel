import {
  DataFrame,
  DataTransformerID,
  PanelOptionsEditorBuilder,
  StandardEditorContext,
  transformDataFrame,
} from '@grafana/data';
import { lastValueFrom } from 'rxjs';
import { SimpleOptions } from 'types';

export async function optionsBuilder(
  builder: PanelOptionsEditorBuilder<SimpleOptions>,
  context: StandardEditorContext<SimpleOptions>
) {
  builder.addSelect({
    category: ['Data'],
    path: 'transformation',
    name: 'Table Transform',
    description: 'How to transform the data coming from the datasource',
    defaultValue: 'timeseries-to-columns',
    settings: {
      options: [
        { value: 'timeseries-to-columns', label: 'Timeseries to Columns' },
        { value: 'timeseries-to-rows', label: 'Timeseries to Rows' },
        { value: 'timeseries-aggregations', label: 'Timeseries Aggregations' },
        { value: 'annotations', label: 'Annotations' },
        { value: 'table', label: 'Table' },
        { value: 'json-data', label: 'JSON Data' },
      ],
    },
  });

  // TODO handle "timeseries-aggregations" selection
  // in the original plugin this columns will turn into the possible Aggregations options:
  // avg, min, max, total, current, count
  builder.addSelect({
    category: ['Data'],
    path: 'transformation-columns',
    name: 'Columns',
    defaultValue: '',
    settings: {
      options: [],
      getOptions: async (context) => {
        try {
          const transformedData = await lastValueFrom(
            transformDataFrame(
              [
                {
                  id: DataTransformerID.joinByField,
                  options: {},
                },
              ],
              context.data
            )
          );

          return getDataFramesFields(transformedData).map((field) => ({ value: field, label: field }));
        } catch (e) {
          return [];
        }
      },
    },
  });
}

export function getDataFramesFields(dataFrames: DataFrame[]): string[] {
  return dataFrames.reduce<string[]>((acc, df) => {
    df.fields.map((field) => {
      if (!acc.includes(field.name)) {
        acc.push(field.name);
      }
    });
    return acc;
  }, []);
}
