import { ValueMapping } from "@grafana/data";
import { FormattedColumnValue } from "./types";
import { getValueMappingResult } from "./valueMappings";

export const GetMappings = (fieldConfigMappings: ValueMapping[] | undefined, dataMappings: ValueMapping[] | undefined) => {
  return fieldConfigMappings && fieldConfigMappings.length > 0 ? fieldConfigMappings : dataMappings;
}

export const ApplyMappings = (value: FormattedColumnValue, mappings: any) => {
  const aValue = getValueMappingResult(mappings, value.valueRaw);
  if (aValue !== null) {
    //console.log(`ApplyMappings matched, mapped value = ` + JSON.stringify(aValue));
    return aValue;
  }
  return null;
}
