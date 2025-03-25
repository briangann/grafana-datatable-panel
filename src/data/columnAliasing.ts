import { ColumnAliasField } from "types";
import { DTColumnType } from "./types";

const getColumnAlias = (columnName: any, columnAliases: ColumnAliasField[]) => {
  // default to the columnName
  let columnAlias = columnName;
  if (columnAliases.length > 0) {
    for (let i = 0; i < columnAliases.length; i++) {
      if (columnAliases[i].name === columnName) {
        columnAlias = columnAliases[i].alias;
        break;
      }
    }
  }
  return columnAlias;
}

export const ApplyColumnAliases = (dtColumns: DTColumnType[], columnAliases: ColumnAliasField[]): DTColumnType[] => {
  for (let i = 0; i < dtColumns.length; i++) {
    const anAlias = getColumnAlias(dtColumns[i].title, columnAliases);
    if (anAlias) {
      dtColumns[i].title = anAlias;
    }
  }
  return dtColumns;
}
