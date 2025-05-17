import {
  applyFieldOverrides,
  DataFrame,
  getDisplayProcessor,
  GrafanaTheme2 } from '@grafana/data';


export const ApplyGrafanaOverrides = (dataFrames: DataFrame[], theme: GrafanaTheme2) => {
  let newDataFrames: DataFrame[] = [];
  if (dataFrames) {
    newDataFrames = applyFieldOverrides({
      data: dataFrames,
      fieldConfig: {
        defaults: {
        },
        overrides: []
      },
      theme,
      replaceVariables: (value: string) => value,
    });
    for (let i = 0; i < newDataFrames[0].fields.length; i++) {
      const aField = newDataFrames[0].fields[i];
      aField.config.decimals = 4;
      const display = getDisplayProcessor({
        field: aField,
        theme,
      });
      // formatted output of one of the fields
      // const fieldValue = aField.values[0];
      // const fv = formattedValueToString(display(fieldValue));
      //console.log(`fieldName ${aField.name} formatted str value ${fv}`);
      aField.display = display;
    }
  }
  return newDataFrames;
}
