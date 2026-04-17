import React, { useMemo, useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { v4 as UUIdv4 } from 'uuid';
import { Button, CascaderOption, Collapse } from '@grafana/ui';
import {
  DEFAULT_CRITICAL_COLOR_HEX,
  DEFAULT_NO_THRESHOLD_COLOR_HEX,
  DEFAULT_OK_COLOR_HEX,
  DEFAULT_WARNING_COLOR_HEX,
} from '../defaults';
import {
  ColumnStyles,
  ColumnStyleDate,
  ColumnStyleHidden,
  ColumnStyleItemTracker,
  ColumnStyleItemType,
  ColumnStyleMetric,
  ColumnStyleString,
} from './types';
import { ColumnStyleItem } from './ColumnStyleItem';
import { Threshold } from '../thresholds/types';
import { getColumnHints } from './columnHints';
import { ColumnStyleColoring, DateFormats } from 'types';
import { TrackerAdapter, useTracker } from 'hooks/useTracker';

const columnStyleAdapter: TrackerAdapter<ColumnStyleItemTracker, ColumnStyleItemType> = {
  toPayload: (t) => t.style,
  reorder: (t, i) => ({ ...t, order: i, style: { ...t.style, order: i } }),
};

export const ColumnStylesEditor: React.FC<StandardEditorProps<ColumnStyleItemType[]>> = ({
  context,
  onChange,
}) => {
  const [settings] = useState<ColumnStyleItemType[] | undefined>(context.options.columnStylesConfig);

  const initialTracker = (): ColumnStyleItemTracker[] =>
    (settings ?? []).map((value, index) => ({
      style: value,
      order: index,
      ID: UUIdv4(),
    }));

  const {
    items: tracker,
    add,
    removeAt,
    updateAt,
    moveUp,
    moveDown,
  } = useTracker(initialTracker, onChange, columnStyleAdapter);

  const [isOpen, setIsOpen] = useState<boolean[]>(() =>
    (settings ?? []).map(() => false),
  );

  const columnHints: CascaderOption[] = useMemo(
    () =>
      context.data?.length
        ? Array.from(getColumnHints(context.data)).map((name) => ({ label: name, value: name }))
        : [],
    [context.data],
  );

  // Children address rows by `style.order`. The adapter's reorder keeps
  // `order === array index` after every mutation, so callers can pass
  // `order` straight through to the hook as the array index.
  const updateColumnStyle = (index: number, value: ColumnStyleItemType) =>
    updateAt(index, { style: value });

  const createDuplicate = (index: number) => {
    const src = tracker[index];
    if (!src) {
      return;
    }
    const original = src.style;
    const nextOrder = tracker.length;
    const copy: ColumnStyleItemType = {
      label: `${original.label} Copy`,
      enabled: original.enabled,
      order: nextOrder,
      nameOrRegex: original.nameOrRegex,
      activeStyle: original.activeStyle,
      hiddenStyle: original.hiddenStyle,
      dateStyle: original.dateStyle,
      metricStyle: original.metricStyle,
      stringStyle: original.stringStyle,
    };
    add({ style: copy, order: nextOrder, ID: UUIdv4() });
    setIsOpen([...isOpen, true]);
  };

  const toggleOpener = (index: number) => {
    const next = [...isOpen];
    next[index] = !next[index];
    setIsOpen(next);
  };

  const addItem = () => {
    const order = tracker.length;
    const style: ColumnStyleItemType = {
      label: `Style-${order}`,
      nameOrRegex: '',
      order,
      enabled: true,
      dateStyle: { dateFormat: DateFormats[0].value } as ColumnStyleDate,
      hiddenStyle: {} as ColumnStyleHidden,
      metricStyle: {
        alias: '',
        thresholds: [] as Threshold[],
        colors: [
          DEFAULT_OK_COLOR_HEX,
          DEFAULT_WARNING_COLOR_HEX,
          DEFAULT_CRITICAL_COLOR_HEX,
          DEFAULT_NO_THRESHOLD_COLOR_HEX,
        ],
        colorMode: ColumnStyleColoring.Cell,
        decimals: '2',
        scaledDecimals: null,
        unitFormat: 'short',
        ignoreNullValues: true,
      } as ColumnStyleMetric,
      stringStyle: {
        clickThrough: '',
        clickThroughCustomTarget: '',
        clickThroughCustomTargetEnabled: false,
        clickThroughOpenNewTab: true,
        clickThroughSanitize: true,
        splitByPattern: '',
      } as ColumnStyleString,
      activeStyle: ColumnStyles.METRIC,
    };
    add({ style, order, ID: UUIdv4() });
    setIsOpen([...isOpen, true]);
  };

  return (
    <>
      <Button fill="solid" variant="primary" icon="plus" onClick={addItem}>
        Add Style
      </Button>
      {tracker &&
        tracker.map((t, index) => (
          <Collapse
            key={`collapse-item-index-${t.ID}`}
            label={t.style.label}
            isOpen={isOpen[index]}
            onToggle={() => toggleOpener(index)}
            collapsible
          >
            <ColumnStyleItem
              key={`style-item-index-${t.ID}`}
              ID={t.ID}
              style={t.style}
              enabled={t.style.enabled}
              setter={updateColumnStyle}
              remover={removeAt}
              moveDown={moveDown}
              moveUp={moveUp}
              createDuplicate={createDuplicate}
              context={context}
              columnHints={columnHints}
            />
          </Collapse>
        ))}
    </>
  );
};
