import endsWith from 'lodash/endsWith';
import mapValues from 'lodash/mapValues';
import isPlainObject from 'lodash/isPlainObject';
import every from 'lodash/every';
import { initialFieldState } from '../reducers/form-reducer';

function isMulti(model) {
  return endsWith(model, '[]');
}

function isFocused(field) {
  return field && field.focus;
}

function isPristine(field) {
  return field ? field.pristine : initialFieldState.pristine;
}

function isTouched(field) {
  return field ? field.touched : initialFieldState.touched;
}

function isEvent(event) {
  return !!(event && event.stopPropagation && event.preventDefault);
}

function getEventValue(event) {
  if (!event.target) {
    if (!event.nativeEvent) {
      return undefined;
    }

    return event.nativeEvent.text;
  }

  if (event.target.multiple) {
    return [...event.target.selectedOptions].map(option => option.value);
  }

  return event.target.value;
}

function getValue(value) {
  return isEvent(value) ? getEventValue(value) : value;
}

function validate(validators, value) {
  const modelValue = getValue(value);

  if (typeof validators === 'function') {
    return validators(modelValue);
  }

  return mapValues(validators, (validator) => validator(modelValue));
}

function isValid(validity) {
  if (isPlainObject(validity)) {
    return every(validity);
  }

  return !!validity;
}

export {
  isFocused,
  isMulti,
  isPristine,
  isTouched,
  getEventValue,
  getValue,
  validate,
  isValid,
};
