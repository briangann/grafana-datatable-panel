import { CascaderOption } from '@grafana/ui';
import { ColumnStyleItemType } from 'types';

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

export interface ColumnStyleItemTracker {
  style: ColumnStyleItemType;
  ID: string;
};
