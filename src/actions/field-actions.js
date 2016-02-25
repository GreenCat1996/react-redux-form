import _get from 'lodash/get';

import * as actionTypes from '../action-types';

const focus = (model) => ({
  type: actionTypes.FOCUS,
  model
});

const blur = (model) => ({
  type: actionTypes.BLUR,
  model
});

const validate = (model) => ({
  type: actionTypes.VALIDATE,
  model
});

const setPristine = (model) => ({
  type: actionTypes.SET_PRISTINE,
  model
});

const setDirty = (model) => ({
  type: actionTypes.SET_DIRTY,
  model
});

const setInitial = (model) => ({
  type: actionTypes.SET_INITIAL,
  model
});

const setPending = (model, pending = true) => ({
  type: actionTypes.SET_PENDING,
  model,
  pending
});

const setValidity = (model, validity) => ({
  type: actionTypes.SET_VALIDITY,
  model,
  validity
});

const setErrors = (model, errors) => ({
  type: actionTypes.SET_ERRORS,
  model,
  errors
});

const setTouched = (model) => ({
  type: actionTypes.SET_TOUCHED,
  model
});

const setUntouched = (model) => ({
  type: actionTypes.SET_UNTOUCHED,
  model
});

const asyncSetValidity = (model, validator) => {
  return (dispatch, getState) => {
    let value = _get(getState(), model);

    dispatch(setPending(model, true));

    const done = (validity) => {
      dispatch(setValidity(model, validity));
      dispatch(setPending(model, false));
    }; 

    let immediateResult = validator(value, done);

    if (typeof immediateResult !== 'undefined') {
      done(immediateResult);
    }
  }
}

const setSubmitted = (model, submitted = true) => ({
  type: actionTypes.SET_SUBMITTED,
  model,
  submitted
});

const setViewValue = (model, value) => ({
  type: actionTypes.SET_VIEW_VALUE,
  model,
  value
});

const submit = (model, promise) => {
  return (dispatch) => {
    dispatch(setPending(model, true));

    promise.then(
      (response) => {
        dispatch(setSubmitted(model, true));
        dispatch(setValidity(model, response));
      },
      (errors) => {
        dispatch(setPending(model, false));
        dispatch(setErrors(model, errors));
      }
    );
  }
}

export {
  focus,
  blur,
  validate,
  setPristine,
  setDirty,
  setInitial,
  setValidity,
  setErrors,
  asyncSetValidity,
  setPending,
  setSubmitted,
  setTouched,
  setUntouched,
  setViewValue,
  submit
}
