import {
  DataTransformerID,
  FieldType,
  standardTransformers,
  standardTransformersRegistry,
  toDataFrame,
  TransformerRegistryItem,
} from '@grafana/data';
import { AggregationType, TransformationOptions } from 'types';
import { GetDataTransformerID, getDataFrameFields, transformData } from './transformations';

// Grafana's runtime populates `standardTransformersRegistry` at app startup.
// In jest we have to seed it ourselves, otherwise `transformDataFrame` throws
// `"<id>" not found in:` when it tries to look up `merge`, `reduce`, etc.
beforeAll(() => {
  standardTransformersRegistry.setInit(() => {
    // `standardTransformers` contains deprecated aliases (e.g.
    // `seriesToColumnsTransformer` shares an id with `joinByFieldTransformer`);
    // Registry.setInit rejects duplicates, so keep first occurrence per id.
    const seen = new Set<string>();
    const items: Array<TransformerRegistryItem<any>> = [];
    for (const t of Object.values(standardTransformers)) {
      if (seen.has(t.id)) {
        continue;
      }
      seen.add(t.id);
      items.push({
        id: t.id,
        name: (t as { name?: string }).name ?? t.id,
        transformation: t,
        editor: () => null,
        imageDark: '',
        imageLight: '',
      });
    }
    return items;
  });
});

describe('GetDataTransformerID', () => {
  it.each([
    [TransformationOptions.JSONData, DataTransformerID.joinByField],
    [TransformationOptions.Table, DataTransformerID.merge],
    [TransformationOptions.TimeSeriesAggregations, DataTransformerID.reduce],
    [TransformationOptions.TimeSeriesToColumns, DataTransformerID.joinByField],
    [TransformationOptions.TimeSeriesToRows, DataTransformerID.seriesToRows],
  ])('maps %s → %s', (option, expected) => {
    expect(GetDataTransformerID(option)).toBe(expected);
  });

  it('falls back to joinByField for an unknown option', () => {
    expect(GetDataTransformerID('unknown' as unknown as TransformationOptions)).toBe(
      DataTransformerID.joinByField,
    );
  });
});

describe('getDataFrameFields', () => {
  it('returns an empty array when given no frames', () => {
    expect(getDataFrameFields([])).toEqual([]);
  });

  it('collects the field names of a single frame', () => {
    const df = toDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: [1, 2] },
        { name: 'A', type: FieldType.number, values: [10, 20] },
      ],
    });
    expect(getDataFrameFields([df])).toEqual(['time', 'A']);
  });

  it('deduplicates field names across multiple frames', () => {
    const a = toDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: [1] },
        { name: 'A', type: FieldType.number, values: [10] },
      ],
    });
    const b = toDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: [2] },
        { name: 'B', type: FieldType.number, values: [20] },
      ],
    });
    // 'time' appears in both frames but is listed once; order preserves first-seen
    expect(getDataFrameFields([a, b])).toEqual(['time', 'A', 'B']);
  });
});

describe('transformData', () => {
  // Two single-row frames with the same schema. After the `merge` transform
  // they should collapse into one frame whose numeric column carries both
  // rows' values. This exercises the transformation pipeline end-to-end
  // against real `@grafana/data` code without mocking.
  it('runs the merge transform and returns a single combined frame', async () => {
    const a = toDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: [1000] },
        { name: 'value', type: FieldType.number, values: [10] },
      ],
    });
    const b = toDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: [2000] },
        { name: 'value', type: FieldType.number, values: [20] },
      ],
    });

    const result = await transformData([a, b], DataTransformerID.merge, []);

    expect(result).toHaveLength(1);
    const valueField = result[0].fields.find((f) => f.name === 'value');
    expect(valueField?.values).toEqual([10, 20]);
  });

  // When the transform is `reduce`, transformData must inject the supplied
  // aggregations into the transform options as `options.reducers`. This
  // case pins that branch — passing a single `mean` reducer across a
  // one-field numeric frame must produce one row with the mean.
  it('passes aggregations into the reduce transform options', async () => {
    const df = toDataFrame({
      fields: [
        { name: 'value', type: FieldType.number, values: [10, 20, 30] },
      ],
    });

    const result = await transformData(
      [df],
      DataTransformerID.reduce,
      [AggregationType.MEAN],
    );

    // The reduce transform produces a frame where each row corresponds to
    // one input field; cell values are the reducer outputs.
    expect(result).toHaveLength(1);
    const meanField = result[0].fields.find((f) => f.name === 'Mean');
    expect(meanField?.values).toEqual([20]);
  });
});
