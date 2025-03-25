import {
  applyFieldOverrides,
  DataFrame,
  formattedValueToString,
  getDisplayProcessor,
  GrafanaTheme2 } from '@grafana/data';


export const ApplyGrafanaOverrides = (dataFrames: DataFrame[], theme: GrafanaTheme2) => {
  if (dataFrames) {
    dataFrames = applyFieldOverrides({
      data: dataFrames,
      fieldConfig: {
        defaults: {
        },
        overrides: []
      },
      theme,
      replaceVariables: (value: string) => value,
    });
    //console.log(dataFrames[0].fields);
    for (let i = 0; i < dataFrames[0].fields.length; i++) {
      const aField = dataFrames[0].fields[i];
      aField.config.decimals = 4;
      const display = getDisplayProcessor({
        field: aField,
        theme,
      });
      //console.log(display);
      // formatted output of one of the fields
      // TODO: cleanup this is not needed, will be done during render
      //console.log(`field name ${aField.name}`);
      const fieldValue = aField.values[0];
      const fv = formattedValueToString(display(fieldValue));
      console.log(`fieldName ${aField.name} formatted str value ${fv}`);
      aField.display = display;
    }
  }
}
