import _get from '../utils/get';
import mapValues from '../utils/map-values';

import actionTypes from '../action-types';
import batchActions from './batch-actions';
import { getValidity, getForm, isValid, isInvalid } from '../utils';
import { trackable } from '../utils/track';

const focus = trackable((model) => ({
  type: actionTypes.FOCUS,
  model,
}));

const blur = trackable((model) => ({
  type: actionTypes.BLUR,
  model,
}));

const setPristine = trackable((model) => ({
  type: actionTypes.SET_PRISTINE,
  model,
}));

const setDirty = trackable((model) => ({
  type: actionTypes.SET_DIRTY,
  model,
}));

const setInitial = trackable((model) => ({
  type: actionTypes.SET_INITIAL,
  model,
}));

const setPending = trackable((model, pending = true) => ({
  type: actionTypes.SET_PENDING,
  model,
  pending,
}));

const setValidity = trackable((model, validity, options = {}) => ({
  type: options.errors
    ? actionTypes.SET_ERRORS
    : actionTypes.SET_VALIDITY,
  model,
  [options.errors ? 'errors' : 'validity']: validity,
}));

const setFieldsValidity = trackable((model, fieldsValidity, options = {}) => ({
  type: actionTypes.SET_FIELDS_VALIDITY,
  model,
  fieldsValidity,
  options,
}));

const setErrors = trackable((model, errors, options = {}) =>
  setValidity(model, errors, {
    ...options,
    errors: true,
  }));

const setFieldsErrors = trackable((model, fieldsErrors, options) =>
  setFieldsValidity(model, fieldsErrors, {
    ...options,
    errors: true,
  }));

const resetValidity = trackable((model) => ({
  type: actionTypes.RESET_VALIDITY,
  model,
}));

const resetErrors = resetValidity;

const setTouched = trackable((model) => ({
  type: actionTypes.SET_TOUCHED,
  model,
}));

const setUntouched = trackable((model) => ({
  type: actionTypes.SET_UNTOUCHED,
  model,
}));

const asyncSetValidity = trackable((model, validator) => (dispatch, getState) => {
  const value = _get(getState(), model);

  dispatch(setPending(model, true));

  const done = (validity) => {
    dispatch(batchActions.batch(model, [
      setValidity(model, validity),
      setPending(model, false),
    ]));
  };

  const immediateResult = validator(value, done);

  if (typeof immediateResult !== 'undefined') {
    done(immediateResult);
  }
});

const setSubmitted = trackable((model, submitted = true) => ({
  type: actionTypes.SET_SUBMITTED,
  model,
  submitted,
}));

const setSubmitFailed = trackable((model) => ({
  type: actionTypes.SET_SUBMIT_FAILED,
  model,
}));


const setViewValue = trackable((model, value) => ({
  type: actionTypes.SET_VIEW_VALUE,
  model,
  value,
}));

const submit = trackable((model, promise, options = {}) => dispatch => {
  dispatch(setPending(model, true));

  const errorsAction = options.fields
    ? setFieldsErrors
    : setErrors;

  promise.then(response => {
    dispatch(batchActions.batch(model, [
      setSubmitted(model, true),
      setValidity(model, response),
    ]));
  }).catch(error => {
    dispatch(batchActions.batch(model, [
      setSubmitFailed(model),
      errorsAction(model, error),
    ]));
  });

  return promise;
});

const submitFields = trackable((model, promise, options = {}) =>
  submit(model, promise, {
    ...options,
    fields: true,
  }));

const validate = trackable((model, validators) => (dispatch, getState) => {
  const value = _get(getState(), model);
  const validity = getValidity(validators, value);

  dispatch(setValidity(model, validity));
});

const validateErrors = trackable((model, errorValidators) => (dispatch, getState) => {
  const value = _get(getState(), model);
  const errors = getValidity(errorValidators, value);

  dispatch(setValidity(model, errors, { errors: true }));
});

function isFormValidWithoutFields(form, fieldsValidity) {
  if (Object.keys(form.validity).length && !isValid(form.validity)) {
    return false;
  }

  // TODO: map through form keys without $form
  const valid = Object.keys(form.fields)
    .every((fieldKey) => {
      if (fieldsValidity.hasOwnProperty(fieldKey)) {
        return true;
      }

      return form.fields[fieldKey].valid;
    });

  return valid;
}

const validateFields = trackable((model, fieldValidators, options = {}) => (dispatch, getState) => {
  const value = _get(getState(), model);

  const fieldsValidity = mapValues(fieldValidators, (validator, field) => {
    const fieldValue = field
      ? _get(value, field)
      : value;

    const fieldValidity = getValidity(validator, fieldValue);

    return fieldValidity;
  });

  const validCB = options.onValid;
  const invalidCB = options.onInvalid;

  if (validCB || invalidCB) {
    const form = getForm(getState(), model);
    const formValid = (form && !fieldsValidity.hasOwnProperty(''))
      ? isFormValidWithoutFields(form, fieldsValidity)
      : true;
    const fieldsValid = options.errors
      ? !isInvalid(fieldsValidity)
      : isValid(fieldsValidity);

    if (validCB && formValid && fieldsValid) {
      validCB();
    } else if (invalidCB) {
      invalidCB();
    }
  }

  const fieldsValiditySetter = options.errors
    ? setFieldsErrors
    : setFieldsValidity;

  dispatch(fieldsValiditySetter(model, fieldsValidity));
});

const validateFieldsErrors = trackable((model, fieldErrorsValidators, options = {}) =>
  validateFields(model, fieldErrorsValidators, {
    ...options,
    errors: true,
  }));

export default {
  asyncSetValidity,
  blur,
  focus,
  submit,
  submitFields,
  setDirty,
  setErrors,
  setInitial,
  setPending,
  setPristine,
  setSubmitted,
  setSubmitFailed,
  setTouched,
  setUntouched,
  setValidity,
  setFieldsValidity,
  setFieldsErrors,
  resetValidity,
  resetErrors,
  setViewValue,
  validate,
  validateErrors,
  validateFields,
  validateFieldsErrors,
};
