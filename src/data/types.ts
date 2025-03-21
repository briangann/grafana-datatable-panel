import { FieldConfig } from "@grafana/data";

export interface DTColumnType {
  title: string;
  data: string;
  type: string;
  className: string;
  fieldConfig: FieldConfig<any>;
};
