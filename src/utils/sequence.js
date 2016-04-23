import identity from 'lodash/identity';
import capitalize from 'lodash/capitalize';
import partial from 'lodash/partial';
import mapValues from 'lodash/mapValues';
import compose from 'lodash/fp/compose';
import isEqual from 'lodash/isEqual';
import memoize from 'lodash/memoize';
import merge from 'lodash/merge';
import icepick from 'icepick';

import { isMulti, getValue, getValidity, invertValidity } from './index';
import actions from '../actions';

const {
  asyncSetValidity,
  blur,
  focus,
  setErrors,
} = actions;

function persistEventWithCallback(callback) {
  return (event) => {
    if (event && event.persist) {
      event.persist();
    }

    callback(event);
    return event;
  };
}

const modelValueUpdaterMap = {
  checkbox: memoize((props, eventValue) => {
    const { model, modelValue } = props;

    if (isMulti(model)) {
      const valueWithItem = modelValue || [];
      const valueWithoutItem = (valueWithItem || []).filter(item => !isEqual(item, eventValue));
      const value = (valueWithoutItem.length === valueWithItem.length)
        ? icepick.push(valueWithItem, eventValue)
        : valueWithoutItem;

      return value;
    }

    return !modelValue;
  }),
  default: memoize((props, eventValue) => eventValue),
};


function isReadOnlyValue(control) {
  return control.type === 'input' // verify === is okay
    && ~['radio', 'checkbox'].indexOf(control.props.type);
}

function deprecateUpdateOn(updateOn) {
  console.warn('Using the updateOn prop as a function will be deprecated in v1.0. '
    + 'Please use the changeAction prop instead.');

  return updateOn;
}

function sequenceEventActions(props) {
  const {
    control,
    dispatch,
    model,
    updateOn,
    parser,
    changeAction,
  } = props;

  const {
    onChange = identity,
    onBlur = identity,
    onFocus = identity,
  } = control.props;

  const controlOnChange = persistEventWithCallback(onChange);
  const controlOnBlur = persistEventWithCallback(onBlur);
  const controlOnFocus = persistEventWithCallback(onFocus);

  const updateOnEventHandler = (typeof updateOn === 'function')
    ? 'onChange'
    : `on${capitalize(props.updateOn)}`;
  const validateOn = `on${capitalize(props.validateOn)}`;
  const asyncValidateOn = `on${capitalize(props.asyncValidateOn)}`;

  const updaterFn = (typeof updateOn === 'function')
    ? deprecateUpdateOn(updateOn)
    : identity;

  const eventActions = {
    onFocus: [() => dispatch(focus(model))],
    onBlur: [() => dispatch(blur(model))],
    onChange: [],
    onLoad: [], // pseudo-event
    onSubmit: [], // pseudo-event
  };

  const controlChangeMethod = partial(changeAction, model);
  const modelValueUpdater = modelValueUpdaterMap[control.props.type]
    || modelValueUpdaterMap.default;

  if (control.props.defaultValue) {
    eventActions.onLoad.push(() => dispatch(
      actions.change(model, control.props.defaultValue)));
  }

  if (props.validators || props.errors) {
    const dispatchValidate = value => {
      const fieldValidity = getValidity(props.validators, value);
      const fieldErrors = getValidity(props.errors, value);

      dispatch(setErrors(model, merge(
        invertValidity(fieldValidity),
        fieldErrors
      )));

      return value;
    };

    eventActions[validateOn].push(dispatchValidate);
    eventActions.onLoad.push(dispatchValidate);
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

  const dispatchChange = (event) => {
    const modelValue = isReadOnlyValue(control)
      ? modelValueUpdater(props, control.props.value)
      : event;

    dispatch(controlChangeMethod(modelValue));

    return modelValue;
  };

  eventActions.onSubmit.push(updaterFn(dispatchChange));

  if (!isReadOnlyValue(control)) {
    eventActions[updateOnEventHandler].push(
      compose(
        updaterFn(dispatchChange),
        partial(modelValueUpdater, props),
        parser,
        getValue,
        controlOnChange));
  } else {
    eventActions[updateOnEventHandler].push(updaterFn(dispatchChange));
  }
  eventActions.onBlur.push(controlOnBlur);
  eventActions.onFocus.push(controlOnFocus);

  return mapValues(eventActions, _actions => compose(..._actions));
}

export {
  sequenceEventActions,
};
