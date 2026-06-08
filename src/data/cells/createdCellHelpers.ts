import { ColumnStyleItemType, FlatRow, FormattedColumnValue } from "types";
import { ProcessClickthrough } from "./cellRenderer";
import { InterpolateFunction, TimeRange } from "@grafana/data";




export const processStringValueStyle = (
  columnStyle: ColumnStyleItemType | null,
  rowData: FlatRow,
  valueFormatted: FormattedColumnValue,
  timeRange: TimeRange,
  replaceVariables: InterpolateFunction): string | null => {

  const processedURL = ProcessClickthrough(
    columnStyle,
    rowData as unknown as FormattedColumnValue[],
    valueFormatted,
    timeRange,
    replaceVariables);
  if (processedURL !== undefined) {
    return processedURL;
  }
  return null;
};
