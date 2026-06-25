import React, { memo, useState } from 'react';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Input, ColorPicker, IconButton, useStyles2, Select } from '@grafana/ui';
import { css } from '@emotion/css';

import { Threshold, ThresholdStates } from 'types';

interface ThresholdItemProps {
  threshold: Threshold;
  key: string;
  ID: string;
  valueSetter: any;
  colorSetter: any;
  stateSetter: any;
  remover: any;
  index: number;
  disabled: boolean;
}

const findThresholdState = (thresholdId: number): SelectableValue => {
  const keys = ThresholdStates.keys();
  for (const aKey of keys) {
    if (ThresholdStates[aKey].value === thresholdId) {
      return ThresholdStates[aKey];
    }
  }
  return ThresholdStates[0];
};

export const ThresholdItem: React.FC<ThresholdItemProps> = memo((options: ThresholdItemProps) => {
  const styles = useStyles2(getThresholdStyles);
  // Initializer callback runs only on mount — avoids iterating ThresholdStates on every render.
  const [threshold, setThreshold] = useState<SelectableValue>(() => findThresholdState(options.threshold.state));

  return (
    <Input
      disabled={options.disabled}
      type="number"
      step="1.0"
      key={options.ID}
      onChange={(e) => options.valueSetter(options.index, Number(e.currentTarget.value))}
      value={options.threshold.value}
      prefix={
        <div className={styles.inputPrefix}>
          <div className={styles.colorPicker}>
            <ColorPicker
              color={options.threshold.color}
              onChange={(color) => options.colorSetter(options.index, color)}
              enableNamedColors={true}
            />
          </div>
        </div>
      }
      suffix={
        <>
          <Select
            disabled={options.disabled}
            menuShouldPortal={true}
            value={threshold}
            onChange={(v) => {
              setThreshold(v);
              options.stateSetter(options.index, v.value);
            }}
            options={ThresholdStates}
          />
          <IconButton
            disabled={options.disabled}
            key="deleteThreshold"
            variant="destructive"
            name="trash-alt"
            tooltip="Delete Threshold"
            onClick={() => options.remover(options.index)}
          />
        </>
      }
    />
  );
}) as React.FC<ThresholdItemProps>;

const getThresholdStyles = (theme: GrafanaTheme2) => {
  return {
    inputPrefix: css`
      display: flex;
      align-items: center;
    `,
    colorPicker: css`
      padding: 0 ${theme.spacing(1)};
    `,
  };
};
