import { ColumnWidthHint } from "types";
import { DTColumnType } from "./types";

const getColumnWidthHint = (name: string, columnWidthHints: ColumnWidthHint[]) => {
  for (let i = 0; i < columnWidthHints.length; i++) {
    if (columnWidthHints[i].name === name) {
      return columnWidthHints[i].width;
    }
  }
  return null;
}

export const ApplyColumnWidthHints = (dtColumns: DTColumnType[], columnWidthHints: ColumnWidthHint[]): DTColumnType[] => {
  for (let i = 0; i < dtColumns.length; i++) {
    const aHint = getColumnWidthHint(dtColumns[i].title!, columnWidthHints);
    if (aHint) {
      dtColumns[i].widthHint = aHint;
    }
  }
  return dtColumns;
}
