//
// NOTE: this is taken from the @grafana/data package,
// which does not appear to export it, bug?
//
import {
  stringToJsRegex,
  MappingType,
  SpecialValueMatch,
  SpecialValueOptions,
  ValueMapping,
  ValueMappingResult } from "@grafana/data";

export function getValueMappingResult(valueMappings: ValueMapping[], value: any): ValueMappingResult | null {
  for (const vm of valueMappings) {
    switch (vm.type) {
      case MappingType.ValueToText:
        if (value == null) {
          continue;
        }

        const result = vm.options[value];
        if (result) {
          return result;
        }

        break;

      case MappingType.RangeToText:
        if (value == null) {
          continue;
        }

        const valueAsNumber = parseFloat(value);
        if (isNaN(valueAsNumber)) {
          continue;
        }

        const from = vm.options.from ?? -Infinity;

        const isNumFrom = !isNaN(from);
        if (isNumFrom && valueAsNumber < from) {
          continue;
        }

        const to = vm.options.to ?? Infinity;

        const isNumTo = !isNaN(to);
        if (isNumTo && valueAsNumber > to) {
          continue;
        }

        return vm.options.result;

      case MappingType.RegexToText:
        if (value == null) {
          continue;
        }

        if (typeof value !== 'string') {
          continue;
        }

        const regex = stringToJsRegex(vm.options.pattern);
        if (value.match(regex)) {
          const res = { ...vm.options.result };

          if (res.text != null) {
            res.text = value.replace(regex, vm.options.result.text || '');
          }

          return res;
        }

      case MappingType.SpecialValue:
        switch ((vm.options as SpecialValueOptions).match) {
          case SpecialValueMatch.Null: {
            if (value == null) {
              return vm.options.result;
            }
            break;
          }
          case SpecialValueMatch.NaN: {
            if (typeof value === 'number' && isNaN(value)) {
              return vm.options.result;
            }
            break;
          }
          case SpecialValueMatch.NullAndNaN: {
            if ((typeof value === 'number' && isNaN(value)) || value == null) {
              return vm.options.result;
            }
            break;
          }
          case SpecialValueMatch.True: {
            if (value === true || value === 'true') {
              return vm.options.result;
            }
            break;
          }
          case SpecialValueMatch.False: {
            if (value === false || value === 'false') {
              return vm.options.result;
            }
            break;
          }
          case SpecialValueMatch.Empty: {
            if (value === '') {
              return vm.options.result;
            }
            break;
          }
        }
    }
  }

  return null;
}

// Ref https://stackoverflow.com/a/58550111
export function isNumeric(num: unknown) {
  return (typeof num === 'number' || (typeof num === 'string' && num.trim() !== '')) && !isNaN(num as number);
}
