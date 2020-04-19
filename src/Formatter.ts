import moment from 'moment';
import kbn from 'grafana/app/core/utils/kbn';
import _ from 'lodash';


/**
 * [formatColumnValue description]
 * @param  {[type]} colIndex [description]
 * @param  {[type]} rowIndex [description]
 * @param  {[type]} value    [description]
 * @return {[type]}          [description]
 */
function formatColumnValue(
  isUtc: boolean,
  sanitize: any,
  colorState: any,
  formatters: any,
  panelStyles: any,
  tableColumns: any,
  tableRows: any,
  colIndex: number,
  rowIndex: number,
  value: any) {

  if (!formatters[colIndex]) {
    for (let i = 0; i < panelStyles.length; i++) {
      const style = panelStyles[i];
      const column = tableColumns[colIndex];
      const regex = stringToJsRegex(style.pattern);
      if (column.text.match(regex)) {
        formatters[colIndex] = createColumnFormatter(isUtc, sanitize, colorState, style, column);
      }
    }
  }

  if (!formatters[colIndex]) {
    formatters[colIndex] = defaultCellFormatter;
  }

  let v = formatters[colIndex](value);

  if (/\$__cell_\d+/.exec(v)) {
    for (let i = tableColumns.length - 1; i >= 0; i--) {
      v = v.replace(`$__cell_${i}`, tableRows[rowIndex][i]);
    }
  }

  return v;
}


/**
 * [createColumnFormatter description]
 * @param  {[type]} isUtc  [description]
 * @param  {[type]} colorState  [description]
 * @param  {[type]} style  [description]
 * @param  {[type]} column [description]
 * @return {[type]}        [description]
 */
function createColumnFormatter(isUtc: boolean, sanitize: any, colorState: any, style: any, column: any) {
  if (!style) {
    return defaultCellFormatter;
  }
  if (style.type === 'hidden') {
    return (v: any) => {
      return null;
    };
  }
  if (style.type === 'date') {
    return (v: any) => {
      if (v === undefined || v === null) {
        return '-';
      }
      if (_.isArray(v)) {
        v = v[0];
      }
      let date = moment(v);
      if (isUtc) {
        date = date.utc();
      }
      return date.format(style.dateFormat);
    };
  }
  if (style.type === 'number') {
    const valueFormatter = kbn.valueFormats[column.unit || style.unit];
    return (v: any) => {
      if (v === null || v === void 0) {
        return '-';
      }
      if (_.isString(v)) {
        return defaultCellFormatter(sanitize, v, style, column);
      }
      if (style.colorMode) {
        colorState[style.colorMode] = getColorForValue(v, style);
      }
      return valueFormatter(v, style.decimals, null);
    };
  }
  if (style.type === 'string') {
    return (v: any) => {
      if (_.isArray(v)) {
        v = v.join(', ');
      }

      const mappingType = style.mappingType || 0;

      if (mappingType === 1 && style.valueMaps) {
        for (let i = 0; i < style.valueMaps.length; i++) {
          const map = style.valueMaps[i];

          if (v === null) {
            if (map.value === 'null') {
              return map.text;
            }
            continue;
          }

          // Allow both numeric and string values to be mapped
          if ((!_.isString(v) && Number(map.value) === Number(v)) || map.value === v) {
            return defaultCellFormatter(sanitize, map.text, style, column);
          }
        }
      }

      if (mappingType === 2 && style.rangeMaps) {
        for (let i = 0; i < style.rangeMaps.length; i++) {
          const map = style.rangeMaps[i];

          if (v === null) {
            if (map.from === 'null' && map.to === 'null') {
              return map.text;
            }
            continue;
          }

          if (Number(map.from) <= Number(v) && Number(map.to) >= Number(v)) {
            return defaultCellFormatter(sanitize, map.text, style, column);
          }
        }
      }

      if (v === null || v === void 0) {
        return '-';
      }

      return defaultCellFormatter(sanitize, v, style, column);
    };
  }

  return (value: any) => {
    return defaultCellFormatter(sanitize, value, style, column);
  };
}

/**
* [defaultCellFormatter description]
* @param  {[type]} v     [description]
* @param  {[type]} style [description]
* @return {[type]}       [description]
*/
function defaultCellFormatter(sanitize: any, v: any, style: any, column: any) {

  if (v === null || v === void 0 || v === undefined || column === null) {
    return '';
  }
  if (_.isArray(v)) {
    v = v.join(', ');
  }
  v = String(v);

  if (typeof style === 'undefined') {
    style = {};
  }
  let cellTemplate = style.url;
  //const cellTemplateVariables = {};

  if (typeof style.splitPattern === 'undefined' || style.splitPattern === '') {
    style.splitPattern = '/ /';
  }

  const regex = stringToJsRegex(String(style.splitPattern));
  const values = v.split(regex);
  if (typeof cellTemplate !== 'undefined') {
    // Replace $__cell with this cell's content.
    cellTemplate = cellTemplate.replace(/\$__cell\b/, v);
    values.map((val: any, i: any) => (cellTemplate = cellTemplate.replace(`$__pattern_${i}`, val)));
  }

  if (style && style.sanitize) {
    return sanitize(v);
  } else if (style && style.link && cellTemplate && column.text === style.column) {
    return '<a href="' + cellTemplate.replace(/\{\}|\$__cell/g, v) + '" target="_blank">' + v + '</a>';
  } else if (style && style.link) {
    return '<a href="' + v + '" target="_blank">' + v + '</a>';
  } else {
    return _.escape(v);
  }
}

/**
 * Given a value, return the color corresponding to the threshold set
 * @param  {[Float]} value [Value to be evaluated]
 * @param  {[Array]} style [Settings containing colors and thresholds]
 * @return {[String]}       [color]
 */
function getColorForValue(value: any, style: any) {
  if (!style.thresholds) {
    return null;
  }
  for (let i = style.thresholds.length; i > 0; i--) {
    if (value >= style.thresholds[i - 1]) {
      return style.colors[i];
    }
  }
  return _.first(style.colors);
}

// to determine the overall row color, the index of the threshold is needed
function getColorIndexForValue(value: any, style: any) {
  if (!style.thresholds) {
    return null;
  }
  for (let i = style.thresholds.length; i > 0; i--) {
    if (value >= style.thresholds[i - 1]) {
      return i;
    }
  }
  return 0;
}

// taken from @grafana/data
function stringToJsRegex(str: string): RegExp {
  if (str[0] !== '/') {
    return new RegExp('^' + str + '$');
  }
  const match = str.match(new RegExp('^/(.*?)/(g?i?m?y?)$'));
  if (!match) {
    throw new Error(`'${str}' is not a valid regular expression.`);
  }
  return new RegExp(match[1], match[2]);
}

export { formatColumnValue, getColorIndexForValue, getColorForValue }
