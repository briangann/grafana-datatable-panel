import React, { useState } from 'react';

import {
  IconName,
  Input,
  Field,
  FieldSet,
  Switch,
  Card,
  IconButton,
  UnitPicker,
  Cascader,
  Select,
} from '@grafana/ui';
import { ColumnStyleItemProps, ColumnStyleItemType } from './types';
import { ThresholdsEditor } from '../thresholds/ThresholdsEditor';
import { Threshold } from '../thresholds/types';
import { ColorModeOptions, DateFormats } from 'types';
import { SelectableValue } from '@grafana/data';

export const ColumnStyleItem: React.FC<ColumnStyleItemProps> = (props) => {
  const [style, _setColumnStyle] = useState(props.style);

  const setColumnStyle = (value: ColumnStyleItemType) => {
    _setColumnStyle(value);
    props.setter(style.order, value);
  };
  const [visibleIcon] = useState<IconName>('eye');
  const [hiddenIcon] = useState<IconName>('eye-slash');

  const ColumnStyleOptions: SelectableValue[] = [
    { label: 'Date', value: 'date' },
    { label: 'String', value: 'string' },
    { label: 'Metric', value: 'metric' },
    { label: 'Hidden', value: 'hidden' },
  ];

  const [clickThroughURL, setClickThroughURL] = useState(props.style.clickThrough);

  const removeItem = () => {
    props.remover(style.order);
  };

  const moveUp = () => {
    props.moveUp(style.order);
  };
  const moveDown = () => {
    props.moveDown(style.order);
  };
  const createDuplicate = () => {
    props.createDuplicate(style.order);
  };

  const setThresholds = (val: Threshold[]) => {
    setColumnStyle({ ...style, thresholds: val });
  };

  const metricItemType = () => {
    return (
      <>
        <Field label="Alias" disabled={!style.enabled} hidden={true}>
          <Input
            value={style.alias}
            placeholder=""
            onChange={(e) => setColumnStyle({ ...style, alias: e.currentTarget.value })}
          />
        </Field>

        <Field label="Decimals" disabled={!style.enabled}>
          <Input
            value={style.decimals}
            type="number"
            step={1}
            placeholder=""
            onChange={(e) => setColumnStyle({ ...style, decimals: e.currentTarget.value })}
          />
        </Field>

        <Field label="Unit Format" disabled={!style.enabled}>
          {style.enabled ? (
            <UnitPicker
              value={style.unitFormat}
              onChange={(val: any) => setColumnStyle({ ...style, unitFormat: val })}
            />
          ) : (
            <span>{style.unitFormat}</span>
          )}
        </Field>

        <Field label="Thresholds" disabled={!style.enabled}>
          <ThresholdsEditor disabled={!style.enabled} thresholds={style.thresholds} setter={setThresholds} />
        </Field>

        <Field hidden={style.thresholds.length === 0} label="Color Mode" disabled={!style.enabled}>
          <Select
            disabled={!style.enabled}
            menuShouldPortal={true}
            value={style.colorMode}
            onChange={(val: any) => setColumnStyle({ ...style, colorMode: val.value })}
            options={ColorModeOptions}
          />
        </Field>
      </>
    )
  }

  const stringItemType = () => {
    return (
      <>
        <Field label="Clickthrough URL" description="URL to Open on Click" disabled={!style.enabled}>
          <Input
            value={clickThroughURL}
            placeholder="https://"
            onChange={(e) => setClickThroughURL(e.currentTarget.value)}
            onBlur={(e) => setColumnStyle({ ...style, clickThrough: e.currentTarget.value })}
          />
        </Field>
        <Field label="Sanitize URL" description="Sanitize URL before evaluating" hidden={style.clickThrough.length === 0} disabled={!style.enabled}>
          <Switch
            transparent={false}
            disabled={!style.enabled}
            value={style.clickThroughSanitize}
            onChange={() => setColumnStyle({ ...style, clickThroughSanitize: !style.clickThroughSanitize })}
          />
        </Field>
        <Field label="Open URL in New Tab" description="Open link in new tab" hidden={style.clickThrough.length === 0} disabled={!style.enabled}>
          <Switch
            transparent={false}
            value={style.clickThroughOpenNewTab}
            disabled={!style.enabled}
            onChange={() => setColumnStyle({ ...style, clickThroughOpenNewTab: !style.clickThroughOpenNewTab })}
          />
        </Field>
        <Field label="Enable Custom URL Target" description="Enable custom target" disabled={!style.enabled} hidden={style.clickThrough.length === 0 && style.clickThroughOpenNewTab}>
          <Switch
            transparent={false}
            value={style.clickThroughCustomTargetEnabled}
            disabled={!style.enabled}
            onChange={() => setColumnStyle({
              ...style,
              clickThroughCustomTargetEnabled: !style.clickThroughCustomTargetEnabled,
              clickThroughCustomTarget: style.clickThroughCustomTarget || ''
            })}
          />
        </Field>
        {style.clickThroughCustomTargetEnabled &&
          <Field label="Custom URL Target" description="Specify a custom target, typical values are: _blank|_self|_parent|_top|framename" disabled={!style.enabled} hidden={style.clickThrough.length === 0 && !style.clickThroughCustomTargetEnabled}>
            <Input
              value={style.clickThroughCustomTarget}
              placeholder="_self"
              disabled={!style.enabled}
              onChange={(e) => setColumnStyle({ ...style, clickThroughCustomTarget: e.currentTarget.value })}
            />
          </Field>
        }
      </>
    );
  };

  const dateItemType = () => {
    return (
      <>
          <Field label="Date Format" disabled={!style.enabled}>
            <Select
              options={DateFormats}
              value={style.dateFormat}
              onChange={(item) => setColumnStyle({ ...style, dateFormat: item.value })}
            />
          </Field>

        <Field label="Ignore Null Values" description="Ignore Null Values" disabled={!style.enabled}>
          <Switch
            transparent={false}
            disabled={!style.enabled}
            value={style.ignoreNullValues}
            onChange={() => setColumnStyle({ ...style, ignoreNullValues: !style.ignoreNullValues })}
          />
        </Field>
      </>
    );
  };

  const hiddenItemType = () => {
    return (
      <>
        <Field label="Ignore Null Values" description="Ignore Null Values" disabled={!style.enabled}>
          <Switch
            transparent={false}
            disabled={!style.enabled}
            value={style.ignoreNullValues}
            onChange={() => setColumnStyle({ ...style, ignoreNullValues: !style.ignoreNullValues })}
          />
        </Field>
      </>
    );
  };

  return (
    <Card key={`style-card-${props.ID}`}>
      <Card.Meta>
        <FieldSet>
          <Field
            label="Label"
            description="Sets the name of the style in the configuration editor."
            disabled={!style.enabled}
          >
            <Input
              value={style.label}
              placeholder=""
              onChange={(e) => setColumnStyle({ ...style, label: e.currentTarget.value })}
            />
          </Field>

          <Field label="Metric/RegEx" disabled={!style.enabled}>
          <Cascader
            initialValue={style.nameOrRegex}
            allowCustomValue={true}
            placeholder=""
            onSelect={
              (val: string) => setColumnStyle(
                {
                  ...style, nameOrRegex: val
                }
              )}
            options={props.columnHints}
          />
          </Field>

          <Field label="Style Item Type" disabled={!style.enabled}>
            <Select
              options={ColumnStyleOptions}
              value={style.styleItemType}
              onChange={(item) => setColumnStyle({ ...style, styleItemType: item.value })}
            />
          </Field>

          {style.styleItemType === 'metric' && metricItemType() }
          {style.styleItemType === 'string' && stringItemType() }
          {style.styleItemType === 'date' && dateItemType() }
          {style.styleItemType === 'hidden' && hiddenItemType() }
        </FieldSet>
      </Card.Meta>

      <Card.Actions>
        <IconButton key="moveUp" name="arrow-up" tooltip="Move Up" onClick={moveUp} />
        <IconButton key="moveDown" name="arrow-down" tooltip="Move Down" onClick={moveDown} />
        <IconButton
          key="styleEnabled"
          name={style.enabled ? visibleIcon : hiddenIcon}
          tooltip="Apply Column Styles"
          onClick={() => setColumnStyle({ ...style, enabled: !style.enabled })}
        />
        <IconButton key="copyStyle" name="copy" tooltip="Duplicate" onClick={createDuplicate} />
        <IconButton
          key="deleteStyle"
          variant="destructive"
          name="trash-alt"
          tooltip="Delete Style"
          onClick={removeItem}
        />
      </Card.Actions>
    </Card>
  );

};
