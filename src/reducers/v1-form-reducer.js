/* eslint-disable */
import _get from 'lodash/get';
import every from 'lodash/every';
import icepick from 'icepick';
import isBoolean from 'lodash/isBoolean';
import isEqual from 'lodash/isEqual';
import isPlainObject from 'lodash/isPlainObject';
import isArray from 'lodash/isArray';
import map from 'lodash/map';
import mapValues from '../utils/map-values';
import compareKeys from '../utils/compare-keys';
import toPath from '../utils/to-path';
import startsWith from 'lodash/startsWith';
import flatten from 'flat';

import actionTypes from '../action-types';
import actions from '../actions/field-actions';
import { isValid } from '../utils';

const initialFieldState = {
  focus: false,
  pending: false,
  pristine: true,
  submitted: false,
  submitFailed: false,
  retouched: false,
  touched: false,
  valid: true,
  validating: false,
  validated: false,
  viewValue: null,
  validity: {},
  errors: {},
};

function createInitialState(state, initialValue) {
  let initialState;

  if (isArray(state)) {
    initialState = state.map(createInitialState);
  } else if (isPlainObject(state)) {  
    initialState = mapValues(state, createInitialState);
  } else {
    return icepick.merge(initialFieldState, {
      initialValue: state,
    });
  }

  initialState.$field = icepick.merge(initialFieldState, {
    initialValue: state,
  });

  return initialState;
}

function formIsValid(formState) {
  return every(mapValues(formState.fields, field => field.valid))
    && every(formState.errors, error => !error);
}

const reactions = {
  [actionTypes.FOCUS]: {
    form: () => ({ focus: true }),
    field: () => ({ focus: true }),
  },
  [actionTypes.SET_PRISTINE]: {
    form: () => ({ pristine: true }),
    field: () => ({ pristine: true }),
  },
  [actionTypes.SET_DIRTY]: {
    form: () => ({ pristine: false }),
    field: () => ({ pristine: false }),
  },
  [actionTypes.BLUR]: (action, state) => ({
    form: () => ({
      focus: false,
      touched: true,
      retouched: !!(state.submitted || state.submitFailed),
    }),
    field: () => ({
      focus: false,
      touched: true,
      retouched: !!(state.submitted || state.submitFailed),
    }),
  }),
  [actionTypes.SET_TOUCHED]: (action, state) => reactions[actionTypes.BLUR](action, state),
  [actionTypes.SET_PENDING]: (action) => ({
    form: () => ({
      pending: action.pending,
      submitted: false,
      submitFailed: false,
      retouched: false,
    }),
    field: () => ({
      pending: action.pending,
      submitted: false,
      submitFailed: false,
      retouched: false,
    }),
  }),
  [actionTypes.SET_VALIDITY]: (action) => {
    let errors;
    if (isPlainObject(action.validity)) {
      errors = mapValues(action.validity, valid => !valid);
    } else {
      errors = !action.validity;
    }

    return {
      form: (state) => ({
        valid: formIsValid(state),
      }),
      field: () => ({
        validity: action.validity,
        valid: isBoolean(errors) ? !errors : every(errors, (error) => !error),
        validated: true,
      }),
    };
  },
  [actionTypes.SET_ERRORS]: (action) => {
    let validity;
    if (isPlainObject(action.errors)) {
      validity = mapValues(action.errors, (error) => !error);
    } else {
      validity = !action.errors;
    }

    return {
      form: (state) => ({
        valid: formIsValid(state),
      }),
      field: () => ({
        errors: action.errors,
        validity,
        valid: isValid(validity),
        validated: true,
      }),
    };
  },
};

function getReaction(action, state) {
  const reaction = reactions[action.type];

  if (!reaction) return false;

  if (typeof reaction === 'function') {
    return reaction(action, state);
  }

  return reaction;
}

export function fieldReducer(state = {}, action, path) {
  const [ parentKey = false, ...childPath ] = toPath(path);

  const reaction = getReaction(action, state);

  if (!parentKey && !childPath.length) {
    if (!reaction) return state;

    return icepick.merge(state, reaction.field(state));
  }

  if (!reaction) return state;

  const subFieldState = icepick.merge(state, {
    [parentKey]: fieldReducer(state[parentKey], action, childPath),
  });

  return icepick.merge(subFieldState, {
    $form: reaction.form(subFieldState),
  });
}

export default function createFormReducer(model, initialState) {
  const modelPath = toPath(model);
  const initialFormState = createInitialState(initialState);

  const formReducer = (state = initialFormState, action) => {
    if (!action.model) return state;

    const path = toPath(action.model);

    if (!isEqual(path.slice(0, modelPath.length), modelPath)) {
      return state;
    }

    const localPath = path.slice(modelPath.length);

    return fieldReducer(state, action, localPath);
  }

  return formReducer;
}
/* eslint-enable */
