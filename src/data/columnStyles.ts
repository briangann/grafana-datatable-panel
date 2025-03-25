import { ColumnStyleItemType } from "components/options/columnstyles/types";
import { DTColumnType } from "./types";

export const ApplyColumnStyles = (columns: DTColumnType[], columnStyles: ColumnStyleItemType[]) => {
  for (const item of columns) {
    for (let index = 0; index < columnStyles.length; index++) {
      const aStyle = columnStyles[index];
      // convert to regexp

      let expression = `${aStyle.nameOrRegex}`;
      // remove leading and ending slashes
      if (expression.startsWith(`/`)) {
        expression = expression.slice(1);
      }
      if (expression.endsWith(`/`)) {
        expression = expression.slice(0, -1);
      }
      const rx = new RegExp(expression);
      //const matches = rx.test(item.title);
      //console.log(matches);
      if (item.title.match(rx)) {
        //console.log(`ApplyColumnStyles: style match found for column ${item}`);
        // set the column style for the item, to be used in rendering
        item.columnStyle = aStyle;
        // matched move on to next column
        break;
      }
    }
  };
  return columns;
};
