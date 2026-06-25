import { ColumnStyleItemType, DTColumnType } from "types";

// Regex patterns in column styles come from dashboard config — stable per load.
// Caching avoids recompiling the same pattern across ApplyColumnStyles calls.
// Cap prevents unbounded growth if a user edits many distinct patterns in a session.
const REGEX_CACHE_MAX = 256;
const compiledRegexCache = new Map<string, RegExp>();

// Exported for test isolation only — not part of the public API.
export const clearColumnStyleRegexCache = () => compiledRegexCache.clear();

export const ApplyColumnStyles = (columns: DTColumnType[], columnStyles: ColumnStyleItemType[]) => {
  // Build a predicate per style once. Regex entries use the module-level cache
  // so the same pattern is never compiled twice across calls.
  const matchers = columnStyles.map(aStyle => {
    const expression = `${aStyle.nameOrRegex}`;
    if (expression.startsWith('/') && expression.endsWith('/')) {
      let rx = compiledRegexCache.get(expression);
      if (!rx) {
        if (compiledRegexCache.size >= REGEX_CACHE_MAX) {
          compiledRegexCache.clear();
        }
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
