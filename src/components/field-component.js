import React, { Component, PropTypes } from 'react';
import connect from 'react-redux/lib/components/connect';

import _get from 'lodash/get';
import capitalize from 'lodash/capitalize';
import compose from 'redux/lib/compose';
import identity from 'lodash/identity';
import isEqual from 'lodash/isEqual';
import mapValues from 'lodash/mapValues';
import partial from 'lodash/partial';

import actions from '../actions';
import Control from './control-component';
import { isMulti, getValue } from '../utils';

const { asyncSetValidity, blur, change, focus, setValidity, toggle, xor } = actions;

function selector(state, { model }) {
  return {
    model,
    modelValue: _get(state, model),
  };
}

const controlPropsMap = {
  default: props => controlPropsMap.text(props),
  checkbox: props => ({
    name: props.model,
    checked: (() => {
      if (isMulti(props.model)) {
        return (props.modelValue || []).filter(item => isEqual(item, props.value)).length;
      }

      return !!props.modelValue;
    })(),
    ...props,
  }),
  radio: props => ({
    name: props.model,
    checked: isEqual(props.modelValue, props.value),
    value: props.value,
    ...props,
  }),
  select: props => ({
    name: props.model,
    value: props.modelValue,
    ...props,
  }),
  text: props => ({
    defaultValue: props.modelValue,
    name: props.model,
    ...props,
  }),
  textarea: props => controlPropsMap.text(props),
};

function changeMethod(model, value, action = change, parser = identity) {
  return compose(partial(action, model), parser, getValue);
}

function isReadOnlyValue(control) {
  return control.type === 'input' // verify === is okay
    && ~['radio', 'checkbox'].indexOf(control.props.type);
}

const controlActionMap = {
  checkbox: props => isMulti(props.model) ? xor : toggle,
  default: () => change,
};

function getControlType(control, options) {
  const { controlPropsMap: _controlPropsMap } = options;

  try {
    let controlDisplayName = control.constructor.displayName
      || control.type.displayName
      || control.type.name
      || control.type; // what was the + '' for? tests pass without it

    if (controlDisplayName === 'input') {
      controlDisplayName = _controlPropsMap[control.props.type] ? control.props.type : 'text';
    }

    return _controlPropsMap[controlDisplayName] ? controlDisplayName : null;
  } catch (error) {
    return undefined;
  }
}

function sequenceEventActions(control, props, options) {
  const { dispatch, model } = props;
  const controlType = props.type || getControlType(control, options);

  const updateOn = (typeof props.updateOn === 'function')
    ? 'onChange'
    : `on${capitalize(props.updateOn || 'change')}`;
  const validateOn = `on${capitalize(props.validateOn || 'change')}`;
  const asyncValidateOn = `on${capitalize(props.asyncValidateOn || 'blur')}`;

  /**
   * updater does not exist. temporarily hard set to identity. possible bug
   */
  // const updaterFn = (typeof updater === 'function')
  //   ? updater
  //   : identity;
  const updaterFn = identity;

  const eventActions = {
    onFocus: [() => dispatch(focus(model))],
    onBlur: [() => dispatch(blur(model))],
    onChange: [],
  };

  const controlAction = (controlActionMap[controlType] || controlActionMap.default)(props);

  const controlChangeMethod = changeMethod(
    model,
    props.value,
    controlAction,
    props.parser
  );

  let dispatchChange;
  if (control.props.hasOwnProperty('value') && isReadOnlyValue(control)) {
    dispatchChange = () => dispatch(controlChangeMethod(control.props.value));
  } else {
    dispatchChange = error => dispatch(controlChangeMethod(error));
  }

  eventActions[updateOn].push(updaterFn(dispatchChange));

  if (props.validators) {
    const dispatchValidate = value => {
      const validity = mapValues(
        props.validators,
        validator => validator(getValue(value))
      );

      dispatch(setValidity(model, validity));

      return value;
    };

    eventActions[validateOn].push(dispatchValidate);
  }

  if (props.asyncValidators) {
    const dispatchAsyncValidate = value => {
      mapValues(props.asyncValidators,
        (validator, key) => dispatch(asyncSetValidity(model,
          (_, done) => {
            const outerDone = valid => done({ [key]: valid });

            validator(getValue(value), outerDone);
          })
        )
      );

      return value;
    };

    eventActions[asyncValidateOn].push(dispatchAsyncValidate);
  }

  return mapValues(eventActions, _actions => compose(..._actions));
}

function createFieldProps(control, props, options) {
  const { model, modelValue } = props;
  const controlType = getControlType(control, options);

  const { controlPropsMap: _controlPropsMap } = options;

  if (!controlType) {
    return false;
  }

  return {
    ..._controlPropsMap[controlType]({
      model,
      modelValue,
      ...control.props,
      ...sequenceEventActions(control, props, options),
    }),
  };
}

function createFieldControlComponent(control, props, options) {
  if (!control || !control.props || Object.hasOwnProperty(control.props, 'modelValue')) {
    return control;
  }

  const controlProps = createFieldProps(control, props, options);

  if (!controlProps) {
    return React.cloneElement(
      control, {
        children: React.Children.map(
          control.props.children,
          child => createFieldControlComponent(
            child,
            { ...props, ...child.props },
            options
          )
        ),
      }
    );
  }

  /* eslint-disable react/prop-types */
  // TODO: Track down where to set correct propType for modelValue
  return <Control {...controlProps} modelValue={props.modelValue} control={control} />;
  /* eslint-enable react/prop-types */
}

function getFieldWrapper(props) {
  if (props.component) {
    return props.component;
  }

  if (props.className || props.children.length > 1) {
    return 'div';
  }

  return null;
}

function createFieldClass(customControlPropsMap = {}) {
  const options = {
    controlPropsMap: {
      ...controlPropsMap,
      ...customControlPropsMap,
    },
  };

  class Field extends Component {
    render() {
      const { props } = this;
      const component = getFieldWrapper(props);

      if (component) {
        return React.createElement(
          component,
          props,
          React.Children.map(
            props.children,
            child => createFieldControlComponent(child, props, options))
        );
      }

      return createFieldControlComponent(React.Children.only(props.children), props, options);
    }
  }

  Field.propTypes = {
    asyncValidators: PropTypes.object,
    component: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.string,
    ]),
    model: PropTypes.string.isRequired,
    parser: PropTypes.func,
    updateOn: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.oneOf([
        'change',
        'blur',
        'focus',
      ]),
    ]),
    validators: PropTypes.object,
  };

  return connect(selector)(Field);
}

export {
  controlPropsMap,
  createFieldClass,
};
export default createFieldClass(controlPropsMap);
