import { Threshold } from '../thresholds/types';

export interface ColumnStyleItemProps {
  style: ColumnStyleItemType;
  ID: string;
  enabled: boolean;
  setter: any;
  remover: any;
  moveUp: any;
  moveDown: any;
  createDuplicate: any;
  context: any;
}

export interface ColumnStyleItemType {
  label: string;
  metricName: string;
  alias: string;
  thresholds: Threshold[];
  colors: string[];
  unitFormat: string;
  decimals: string;
  scaledDecimals: number | null;
  enabled: boolean;
  clickThrough: string | '';
  clickThroughSanitize: boolean;
  clickThroughOpenNewTab: boolean;
  clickThroughCustomTargetEnabled: boolean;
  clickThroughCustomTarget: string;
  order: number;
}

export interface ColumnStyleItemTracker {
  style: ColumnStyleItemType;
  order: number;
  ID: string;
}
