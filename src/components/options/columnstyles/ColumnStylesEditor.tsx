import React, { useEffect, useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { v4 as UUIdv4 } from 'uuid';
import { Button, CascaderOption, Collapse } from '@grafana/ui';
import {
  DEFAULT_CRITICAL_COLOR_HEX,
  DEFAULT_NO_THRESHOLD_COLOR_HEX,
  DEFAULT_OK_COLOR_HEX,
  DEFAULT_WARNING_COLOR_HEX,
} from '../defaults';
import { ColumnStyleItemTracker, ColumnStyleItemType } from './types';
import { ColumnStyleItem } from './ColumnStyleItem';
import { Threshold } from '../thresholds/types';
import { getColumnHints } from './columnHints';

export interface ColumnStylesEditorSettings {
  styles: ColumnStyleItemType[];
  enabled: boolean;
}

interface Props extends StandardEditorProps<string | string[] | null, ColumnStylesEditorSettings> {}

export const ColumnStylesEditor: React.FC<Props> = ({ context, onChange }) => {
  const [settings] = useState(context.options.columnStylesConfig);
  const [columnHints, setColumnHints] = useState<CascaderOption[]>([]);

  const [tracker, _setTracker] = useState((): ColumnStyleItemTracker[] => {
    if (!settings.styles) {
      return [] as ColumnStyleItemTracker[];
    }
    const items: ColumnStyleItemTracker[] = [];
    settings.styles.forEach((value: ColumnStyleItemType, index: number) => {
      items[index] = {
        style: value,
        order: index,
        ID: UUIdv4(),
      };
    });
    return items;
  });

  const setTracker = (v: ColumnStyleItemTracker[]) => {
    _setTracker(v);
    const allStyles: ColumnStyleItemType[] = [];
    v.forEach((element) => {
      allStyles.push(element.style);
    });
    const columnStylesConfig = {
      styles: allStyles,
      enabled: settings.enabled,
    };
    onChange(columnStylesConfig as any);
  };

  const [isOpen, setIsOpen] = useState((): boolean[] => {
    if (!tracker) {
      return [] as boolean[];
    }
    let size = tracker.length;
    const openStates: boolean[] = [];
    while (size--) {
      openStates[size] = false;
    }
    return openStates;
  });

  const updateColumnStyle = (index: number, value: ColumnStyleItemType) => {
    tracker[index].style = value;
    // works ... setTracker(tracker);
    setTracker([...tracker]);
  };

  const createDuplicate = (index: number) => {
    const original = tracker[index].style;
    const order = tracker.length;
    const aStyle: ColumnStyleItemType = {
      label: `${original.label} Copy`,
      enabled: original.enabled,
      metricName: original.metricName,
      alias: original.alias,
      thresholds: original.thresholds,
      clickThrough: original.clickThrough,
      clickThroughOpenNewTab: original.clickThroughOpenNewTab,
      clickThroughSanitize: original.clickThroughSanitize,
      clickThroughCustomTargetEnabled: original.clickThroughCustomTargetEnabled,
      clickThroughCustomTarget: original.clickThroughCustomTarget,
      unitFormat: original.unitFormat,
      scaledDecimals: original.scaledDecimals,
      decimals: original.decimals,
      colors: original.colors,
      order: order,
    };
    const aTracker: ColumnStyleItemTracker = {
      style: aStyle,
      order: order,
      ID: UUIdv4(),
    };
    setTracker([...tracker, aTracker]);
    setIsOpen([...isOpen, true]);
  };

  // generic move
  const arrayMove = (arr: any, oldIndex: number, newIndex: number) => {
    if (newIndex >= arr.length) {
      let k = newIndex - arr.length + 1;
      while (k--) {
        arr.push(undefined);
      }
    }
    arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
  };

  const moveDown = (index: number) => {
    if (index !== tracker.length - 1) {
      arrayMove(tracker, index, index + 1);
      // reorder
      for (let i = 0; i < tracker.length; i++) {
        tracker[i].order = i;
        tracker[i].style.order = i;
      }
      setTracker([...tracker]);
    }
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      arrayMove(tracker, index, index - 1);
      // reorder
      for (let i = 0; i < tracker.length; i++) {
        tracker[i].order = i;
        tracker[i].style.order = i;
      }
      setTracker([...tracker]);
    }
  };

  const removeColumnStyle = (index: number) => {
    const allStyles = [...tracker];
    let removeIndex = 0;
    for (let i = 0; i < allStyles.length; i++) {
      if (allStyles[i].order === index) {
        removeIndex = i;
        break;
      }
    }
    allStyles.splice(removeIndex, 1);
    // reorder
    for (let i = 0; i < allStyles.length; i++) {
      allStyles[i].order = i;
      allStyles[i].style.order = i;
    }
    setTracker([...allStyles]);
  };

  const toggleOpener = (index: number) => {
    const currentState = [...isOpen];
    currentState[index] = !currentState[index];
    setIsOpen([...currentState]);
  };

  const addItem = () => {
    const order = tracker.length;
    const aStyle: ColumnStyleItemType = {
      label: `Style-${order}`,
      enabled: true,
      metricName: '',
      alias: '',
      thresholds: [] as Threshold[],
      clickThrough: '',
      clickThroughOpenNewTab: true,
      clickThroughSanitize: true,
      clickThroughCustomTargetEnabled: false,
      clickThroughCustomTarget: '',
      unitFormat: 'short',
      scaledDecimals: null,
      decimals: '2',
      colors: [
        DEFAULT_OK_COLOR_HEX,
        DEFAULT_WARNING_COLOR_HEX,
        DEFAULT_CRITICAL_COLOR_HEX,
        DEFAULT_NO_THRESHOLD_COLOR_HEX,
      ],
      order: order,
    };
    const aTracker: ColumnStyleItemTracker = {
      style: aStyle,
      order: order,
      ID: UUIdv4(),
    };
    setTracker([...tracker, aTracker]);
    // add an opener also
    setIsOpen([...isOpen, true]);
  };

  useEffect(() => {
    if (context.data) {
      let hints: CascaderOption[] = [];
      let columnHints = getColumnHints(context.data);
      for (const name of columnHints) {
        hints.push({
          label: name,
          value: name,
        });
      }
      setColumnHints(hints);
    }
  }, [context.data]);

  return (
    <>
      <Button fill="solid" variant="primary" icon="plus" onClick={addItem}>
        Add Style
      </Button>
      {tracker &&
        tracker.map((tracker: ColumnStyleItemTracker, index: number) => {
          return (
            <Collapse
              key={`collapse-item-index-${tracker.ID}`}
              label={tracker.style.label}
              isOpen={isOpen[index]}
              onToggle={() => toggleOpener(index)}
              collapsible
            >
              <ColumnStyleItem
                key={`style-item-index-${tracker.ID}`}
                ID={tracker.ID}
                style={tracker.style}
                enabled={tracker.style.enabled}
                setter={updateColumnStyle}
                remover={removeColumnStyle}
                moveDown={moveDown}
                moveUp={moveUp}
                createDuplicate={createDuplicate}
                context={context}
                columnHints={columnHints}
              />
            </Collapse>
          );
        })}
    </>
  );
};
