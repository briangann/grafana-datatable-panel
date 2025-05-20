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

  const [clickThroughURL, setClickThroughURL] = useState(props.style.stringStyle.clickThrough);
  const [splitByPattern, setSplitByPattern] = useState(props.style.stringStyle.splitByPattern);

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
    setColumnStyle({ ...style, metricStyle: {
      thresholds: val,
      alias: style.metricStyle.alias,
      colors: style.metricStyle.colors,
      decimals: style.metricStyle.decimals,
      scaledDecimals: style.metricStyle.scaledDecimals,
      unitFormat: style.metricStyle.unitFormat,
      ignoreNullValues: style.metricStyle.ignoreNullValues,
    }});
  };

  const metricItemType = () => {
    return (
      <>
        <Field label="Alias" disabled={!style.enabled} hidden={true}>
          <Input
            value={style.metricStyle.alias}
            placeholder=""
            onChange={(e) => setColumnStyle({
              ...style,
              metricStyle: {
                ...style.metricStyle,
                alias: e.currentTarget.value}})}
          />
        </Field>

        <Field label="Decimals" disabled={!style.enabled}>
          <Input
            value={style.metricStyle.decimals}
            type="number"
            step={1}
            placeholder=""
            onChange={(e) => setColumnStyle({
              ...style,
              metricStyle: {
                ...style.metricStyle,
                decimals: e.currentTarget.value}})}
          />
        </Field>

        <Field label="Unit Format" disabled={!style.enabled}>
          {style.enabled ? (
            <UnitPicker
              value={style.metricStyle.unitFormat}
            onChange={(e) => setColumnStyle({
              ...style,
              metricStyle: {
                ...style.metricStyle,
                unitFormat: e||'short'}})}
            />
          ) : (
            <span>{style.metricStyle.unitFormat}</span>
          )}
        </Field>

        <Field label="Thresholds" disabled={!style.enabled}>
          <ThresholdsEditor disabled={!style.enabled} thresholds={style.metricStyle.thresholds} setter={setThresholds} />
        </Field>

        <Field hidden={style.metricStyle.thresholds?.length === 0} label="Color Mode" disabled={!style.enabled}>
          <Select
            disabled={!style.enabled}
            menuShouldPortal={true}
            value={style.metricStyle.colorMode}
            onChange={(e) => setColumnStyle({
              ...style,
              metricStyle: {
                ...style.metricStyle,
                colorMode: e.value}})}
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
            onBlur={(e) => setColumnStyle({
              ...style,
              stringStyle: {
                ...style.stringStyle,
                clickThrough: e.currentTarget.value}})}
          />
        </Field>
        <Field label="Split By RegEx" description="Split cell content by regular expression" hidden={style.stringStyle.clickThrough?.length === 0} disabled={!style.enabled}>
          <Input
            value={splitByPattern}
            placeholder=""
            onChange={(e) => setSplitByPattern(e.currentTarget.value)}
            onBlur={(e) => setColumnStyle({
              ...style,
              stringStyle: {
                ...style.stringStyle,
                splitByPattern: e.currentTarget.value}})}
          />
        </Field>
        <Field label="Sanitize URL" description="Sanitize URL before evaluating" hidden={style.stringStyle.clickThrough?.length === 0} disabled={!style.enabled}>
          <Switch
            transparent={false}
            disabled={!style.enabled}
            value={style.stringStyle.clickThroughSanitize}
            onChange={(e) => setColumnStyle({
              ...style,
              stringStyle: {
                ...style.stringStyle,
                clickThroughSanitize: !style.stringStyle.clickThroughSanitize}})}
          />
        </Field>
        <Field label="Open URL in New Tab" description="Open link in new tab" hidden={style.stringStyle.clickThrough?.length === 0} disabled={!style.enabled}>
          <Switch
            transparent={false}
            value={style.stringStyle.clickThroughOpenNewTab}
            disabled={!style.enabled}
            onChange={(e) => setColumnStyle({
              ...style,
              stringStyle: {
                ...style.stringStyle,
                clickThroughOpenNewTab: !style.stringStyle.clickThroughOpenNewTab}})}
          />
        </Field>
        <Field label="Enable Custom URL Target"
          description="Enable custom target"
          disabled={!style.enabled}
          hidden={style.stringStyle.clickThrough?.length === 0 && style.stringStyle.clickThroughOpenNewTab}>
          <Switch
            transparent={false}
            value={style.stringStyle.clickThroughCustomTargetEnabled}
            disabled={!style.enabled}
            onChange={(e) => setColumnStyle({
              ...style,
              stringStyle: {
                ...style.stringStyle,
                clickThroughCustomTargetEnabled: !style.stringStyle.clickThroughCustomTargetEnabled,
                clickThroughCustomTarget: style.stringStyle.clickThroughCustomTarget,
              }})}
          />
        </Field>
        {style.stringStyle.clickThroughCustomTargetEnabled &&
          <Field label="Custom URL Target"
            description="Specify a custom target, typical values are: _blank|_self|_parent|_top|framename"
            disabled={!style.enabled}
            hidden={style.stringStyle.clickThrough?.length === 0 && !style.stringStyle.clickThroughCustomTargetEnabled}>
            <Input
              value={style.stringStyle.clickThroughCustomTarget}
              placeholder="_self"
              disabled={!style.enabled}
              onChange={(e) => setColumnStyle({
              ...style,
              stringStyle: {
                ...style.stringStyle,
                clickThroughCustomTarget: e.currentTarget.value}})}
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
              value={style.dateStyle.dateFormat}
              onChange={(item) => setColumnStyle({
              ...style,
              dateStyle: {
                ...style.dateStyle,
                dateFormat: item.value}})}
            />
          </Field>
      </>
    );
  };

  const hiddenItemType = () => {
    return (
      <>
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

          <Field label="Style Item Type" disabled={!style.enabled}>
            <Select
              options={ColumnStyleOptions}
              value={style.activeStyle}
              onChange={(item) => setColumnStyle({ ...style, activeStyle: item.value })}
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

          {style.activeStyle === 'metric' && metricItemType() }
          {style.activeStyle === 'string' && stringItemType() }
          {style.activeStyle === 'date' && dateItemType() }
          {style.activeStyle === 'hidden' && hiddenItemType() }
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
