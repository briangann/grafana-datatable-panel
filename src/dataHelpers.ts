import { DataFrame } from '@grafana/data';
import { ConfigColumns } from 'datatables.net';

function normalizeFieldName(field: string) {
  return field
    .replace(/ /g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();
}

export function dataFrameToDataTableFormat<T>(dataFrames: DataFrame[]): { columns: ConfigColumns[]; rows: T[] } {
  const dataFrame = dataFrames[0];

  const columns = dataFrame.fields.map((field) => {
    return {
      title: field.name,
      data: normalizeFieldName(field.name),
    };
  });
  const rows = [] as T[];

  for (let i = 0; i < dataFrame.length; i++) {
    const row = {};
    for (let j = 0; j < columns.length; j++) {
      const value = dataFrame.fields[j].values[i];
      //@ts-ignore
      row[columns[j].data] = value;
    }
    rows.push(row as T);
  }

  return { columns, rows };
}
