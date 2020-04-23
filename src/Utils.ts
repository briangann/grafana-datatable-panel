import _ from 'lodash';

/**
 * Given a value, return the color corresponding to the threshold set
 * @param  {[Float]} value [Value to be evaluated]
 * @param  {[Array]} style [Settings containing colors and thresholds]
 * @return {[String]}       [color]
 */
function GetColorForValue(value: any, style: any) {
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
function GetColorIndexForValue(value: any, style: any) {
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
function StringToJsRegex(str: string): RegExp {
  if (str[0] !== '/') {
    return new RegExp('^' + str + '$');
  }
  const match = str.match(new RegExp('^/(.*?)/(g?i?m?y?)$'));
  if (!match) {
    throw new Error(`'${str}' is not a valid regular expression.`);
  }
  return new RegExp(match[1], match[2]);
}

export { StringToJsRegex, GetColorIndexForValue, GetColorForValue };
