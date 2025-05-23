import { ColumnStyleItemType } from "components/options/columnstyles/types";
import { DTColumnType } from "./types";

export const ApplyColumnStyles = (columns: DTColumnType[], columnStyles: ColumnStyleItemType[]) => {
  for (const item of columns) {
    for (let index = 0; index < columnStyles.length; index++) {
      const aStyle = columnStyles[index];
      // convert to regexp
      let expression = `${aStyle.nameOrRegex}`;
      if (expression.startsWith(`/`) && expression.endsWith(`/`)) {
        // remove leading and ending slashes
        expression = expression.slice(1);
        expression = expression.slice(0, -1);
        const rx = new RegExp(expression);
        if (item.title.match(rx)) {
          // set the column style for the item, to be used in rendering
          item.columnStyles?.push(aStyle);
          // matched move on to next column
          break;
        }
      } else {
        // not regex, exact match required
        if (item.title === expression) {
          item.columnStyles?.push(aStyle);
          break;
        }
      }
    }
  };
};
