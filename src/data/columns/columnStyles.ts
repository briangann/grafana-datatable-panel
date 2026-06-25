import { ColumnStyleItemType, DTColumnType } from "types";

// Regex patterns in column styles come from dashboard config — stable per load.
// Caching avoids recompiling the same pattern across ApplyColumnStyles calls.
const compiledRegexCache = new Map<string, RegExp>();

export const ApplyColumnStyles = (columns: DTColumnType[], columnStyles: ColumnStyleItemType[]) => {
  // Build a predicate per style once. Regex entries use the module-level cache
  // so the same pattern is never compiled twice across calls.
  const matchers = columnStyles.map(aStyle => {
    const expression = `${aStyle.nameOrRegex}`;
    if (expression.startsWith('/') && expression.endsWith('/')) {
      let rx = compiledRegexCache.get(expression);
      if (!rx) {
        rx = new RegExp(expression.slice(1, -1));
        compiledRegexCache.set(expression, rx);
      }
      return { style: aStyle, test: (title: string) => rx!.test(title) };
    }
    return { style: aStyle, test: (title: string) => title === expression };
  });

  for (const item of columns) {
    for (const entry of matchers) {
      if (entry.test(item.title)) {
        item.columnStyles?.push(entry.style);
        break;
      }
    }
  }
};
