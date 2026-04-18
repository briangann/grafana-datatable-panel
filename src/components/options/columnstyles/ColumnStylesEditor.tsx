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
  ColumnAlignment,
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
  reorder: (t, i) => ({ ...t, style: { ...t.style, order: i } }),
};

export const ColumnStylesEditor: React.FC<StandardEditorProps<ColumnStyleItemType[]>> = ({
  context,
  onChange,
}) => {
  const initialTracker = (): ColumnStyleItemTracker[] =>
    (context.options.columnStylesConfig ?? []).map((value: ColumnStyleItemType) => ({
      style: value,
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

  // Keyed by tracker ID so open state survives reorder and remove.
  const [isOpen, setIsOpen] = useState<Record<string, boolean>>({});

  const columnHints: CascaderOption[] = useMemo(
    () =>
      context.data?.length
        ? Array.from(getColumnHints(context.data)).map((name) => ({ label: name, value: name }))
        : [],
    [context.data],
  );

  const updateColumnStyle = (index: number, value: ColumnStyleItemType) =>
    updateAt(index, { style: value });

  const createDuplicate = (index: number) => {
    const src = tracker[index];
    if (!src) {
      return;
    }
    const nextOrder = tracker.length;
    const copy: ColumnStyleItemType = {
      ...src.style,
      label: `${src.style.label} Copy`,
      order: nextOrder,
    };
    const id = UUIdv4();
    add({ style: copy, ID: id });
    setIsOpen((prev) => ({ ...prev, [id]: true }));
  };

  const toggleOpener = (id: string) =>
    setIsOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const addItem = () => {
    const order = tracker.length;
    const style: ColumnStyleItemType = {
      label: `Style-${order}`,
      nameOrRegex: '',
      order,
      enabled: true,
      align: ColumnAlignment.DEFAULT,
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
    const id = UUIdv4();
    add({ style, ID: id });
    setIsOpen((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <>
      <Button fill="solid" variant="primary" icon="plus" onClick={addItem}>
        Add Style
      </Button>
      {tracker.map((t, index) => (
        <Collapse
          key={`collapse-item-index-${t.ID}`}
          label={t.style.label}
          isOpen={!!isOpen[t.ID]}
          onToggle={() => toggleOpener(t.ID)}
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
