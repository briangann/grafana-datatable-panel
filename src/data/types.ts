import { FieldConfig } from "@grafana/data";
import { ColumnStyleItemType } from "components/options/columnstyles/types";

export interface DTColumnType {
  title: string;
  data: string;
  type: string;
  className: string;
  fieldConfig: FieldConfig<any>;
  columnStyle: ColumnStyleItemType | null;
  widthHint: string;
};
