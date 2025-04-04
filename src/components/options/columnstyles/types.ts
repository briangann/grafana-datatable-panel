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

export interface ColumnStyleItemType {
  label: string;
  nameOrRegex: string;
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
  colorMode?: string;
  dateFormat?: string;
  mappingType?: number;
  ignoreNullValues: boolean;
  styleItemType: string;
};

export interface ColumnStyleItemTracker {
  style: ColumnStyleItemType;
  order: number;
  ID: string;
};
