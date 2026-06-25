import { ColumnStyleItemType, DTColumnType } from "types";

export const ApplyColumnStyles = (columns: DTColumnType[], columnStyles: ColumnStyleItemType[]) => {
  // Pre-compile regex patterns once before the nested loop — avoids
  // reconstructing the same RegExp for every column × style combination.
  const compiled = columnStyles.map(aStyle => {
    const expression = `${aStyle.nameOrRegex}`;
    if (expression.startsWith('/') && expression.endsWith('/')) {
      return { style: aStyle, rx: new RegExp(expression.slice(1, -1)) };
    }
    return { style: aStyle, rx: null, expression };
  });

  for (const item of columns) {
    for (const entry of compiled) {
      if (entry.rx !== null) {
        if (item.title.match(entry.rx)) {
          item.columnStyles?.push(entry.style);
          break;
        }
      } else {
        if (item.title === entry.expression) {
          item.columnStyles?.push(entry.style);
          break;
        }
      }
    }
  }
};
