import { CascaderOption } from '@grafana/ui';
import { Threshold } from '../thresholds/types';

export interface ColumnStyleItemProps {
  columnHints: CascaderOption[];
  style: ColumnStyleItemType;
  ID: string;
  enabled: boolean;
  setter: any;
  remover: any;
  moveUp: any;
  moveDown: any;
  createDuplicate: any;
  context: any;
};

export interface ColumnStyleHidden {
};

export interface ColumnStyleDate {
  dateFormat?: string;
};

export interface ColumnStyleMetric {
  alias: string;
  thresholds: Threshold[];
  colors: string[];
  colorMode?: string;
  decimals: string;
  scaledDecimals: number | null;
  unitFormat: string;
  ignoreNullValues: boolean;
};
export interface ColumnStyleString {
  clickThrough: string;
  clickThroughSanitize: boolean;
  clickThroughOpenNewTab: boolean;
  clickThroughCustomTargetEnabled: boolean;
  clickThroughCustomTarget: string;
  mappingType?: number;
  splitByPattern: string,
};

export enum ColumnStyles {
  DATE = 'date',
  HIDDEN = 'hidden',
  METRIC = 'metric',
  STRING = 'string',
}
export interface ColumnStyleItemType {
  // common properties
  activeStyle: ColumnStyles;
  enabled: boolean;
  label: string;
  nameOrRegex: string;
  order: number;
  // allows switching the styles without losing data
  dateStyle: ColumnStyleDate;
  hiddenStyle: ColumnStyleHidden;
  metricStyle: ColumnStyleMetric;
  stringStyle: ColumnStyleString;
};

export interface ColumnStyleItemTracker {
  style: ColumnStyleItemType;
  order: number;
  ID: string;
};
