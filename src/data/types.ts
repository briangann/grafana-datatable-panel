import { FieldConfig } from "@grafana/data";
import { ColumnStyleItemType } from "components/options/columnstyles/types";

export interface DTColumnType {
  title: string;
  data: string;
  type: string;
  className: string;
  fieldConfig?: FieldConfig<any>;
  columnStyles: ColumnStyleItemType[];
  widthHint?: string;
  visible: boolean;
};

export interface FormattedColumnValue {
  valueRaw: number | string | null,
  valueFormatted: string,
  valueRounded: number | null,
  valueRoundedAndFormatted: string | null,
};
