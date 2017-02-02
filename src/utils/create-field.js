import initialFieldState from '../constants/initial-field-state';
import isPlainObject from './is-plain-object';
import mapValues from './map-values';

/* eslint-disable no-use-before-define */
export function fieldOrForm(model, value, customInitialFieldState) {
  if (Array.isArray(value) || isPlainObject(value)) {
    return createFormState(model, value, customInitialFieldState);
  }

  return createFieldState(model, value, customInitialFieldState);
}
/* eslint-enable no-use-before-define */

export function getMeta(fieldLike, prop) {
  if (fieldLike && fieldLike.$form) return fieldLike.$form[prop];

  return fieldLike[prop];
}

function getSubModelString(model, subModel) {
  if (!model) return subModel;

  return `${model}.${subModel}`;
}

export default function createFieldState(model, value, customInitialFieldState) {
  return {
    ...initialFieldState,
    ...customInitialFieldState,
    model,
    value,
    initialValue: value,
  };
}

export function createFormState(model, values, customInitialFieldState, options = {}) {
  const state = {
    $form: createFieldState(model, values, customInitialFieldState, options),
  };

  if (options.lazy) return state;

  Object.assign(state, mapValues(values, (value, key) => {
    const subModel = getSubModelString(model, key);

    return fieldOrForm(subModel, value, customInitialFieldState);
  }));

  return state;
}
