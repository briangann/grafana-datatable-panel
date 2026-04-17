import React from 'react';
import { orderBy } from 'lodash';
import { Button, useTheme2 } from '@grafana/ui';
import { v4 as UUIdv4 } from 'uuid';
import { Threshold, ThresholdItemTracker } from './types';
import { ThresholdItem } from './ThresholdItem';
import {
  DEFAULT_OK_COLOR_HEX,
  DEFAULT_WARNING_COLOR_HEX,
  DEFAULT_CRITICAL_COLOR_HEX,
} from '../defaults';
import { TrackerAdapter, useTracker } from 'hooks/useTracker';

interface Props {
  thresholds: Threshold[];
  setter: (thresholds: Threshold[]) => void;
  disabled?: boolean;
}

const thresholdAdapter: TrackerAdapter<ThresholdItemTracker, Threshold> = {
  toPayload: (t) => t.threshold,
};

const colorForThresholdState = (state: number): string => {
  switch (state) {
    case 0:
      return DEFAULT_OK_COLOR_HEX;
    case 1:
      return DEFAULT_WARNING_COLOR_HEX;
    case 2:
      return DEFAULT_CRITICAL_COLOR_HEX;
    default:
      return DEFAULT_OK_COLOR_HEX;
  }
};

export const ThresholdsEditor: React.FC<Props> = (options) => {
  const theme2 = useTheme2();

  const initialTracker = (): ThresholdItemTracker[] =>
    (options.thresholds ?? []).map((value) => ({
      threshold: value,
      ID: UUIdv4(),
    }));

  const { items: tracker, add, removeAt, updateAt, setAll } = useTracker(
    initialTracker,
    options.setter,
    thresholdAdapter,
  );

  const updateThresholdValue = (index: number, value: number) => {
    const updated = tracker.map((t, i) =>
      i === index
        ? { ...t, threshold: { ...t.threshold, value: Number(value) } }
        : t,
    );
    setAll(orderBy(updated, ['threshold.value'], ['asc']));
  };

  const updateThresholdColor = (index: number, color: string) => {
    updateAt(index, {
      threshold: {
        ...tracker[index].threshold,
        color: theme2.visualization.getColorByName(color),
      },
    });
  };

  const updateThresholdState = (index: number, state: number) => {
    const existing = tracker[index].threshold;
    const nextThreshold: Threshold =
      state < 3
        ? { ...existing, state, color: colorForThresholdState(state) }
        : { ...existing, state };
    updateAt(index, { threshold: nextThreshold });
  };

  const addItem = () => {
    add({
      threshold: {
        color: DEFAULT_OK_COLOR_HEX,
        state: 0,
        value: 0,
      },
      ID: UUIdv4(),
    });
  };

  return (
    <>
      <Button
        disabled={options.disabled}
        fill="solid"
        variant="primary"
        icon="plus"
        onClick={addItem}
      >
        Add Threshold
      </Button>
      {tracker &&
        tracker.map((t, index) => (
          <ThresholdItem
            disabled={options.disabled || false}
            key={`threshold-item-index-${t.ID}`}
            ID={t.ID}
            threshold={t.threshold}
            valueSetter={updateThresholdValue}
            colorSetter={updateThresholdColor}
            stateSetter={updateThresholdState}
            remover={removeAt}
            index={index}
          />
        ))}
    </>
  );
};
