import _get from 'lodash/get';
import endsWith from 'lodash/endsWith';
import icepick from 'icepick';
import isEqual from 'lodash/isEqual';

import actionTypes from '../action-types';

function isEvent(event) {
  return !!(event && event.stopPropagation && event.preventDefault);
}

function getValue(event) {
  return isEvent(event) ? event.target.value : event;
}

function isMulti(model) {
  return endsWith(model, '[]');
}

const change = (model, value) => ({
  type: actionTypes.CHANGE,
  model,
  multi: isMulti(model),
  value: getValue(value),
});

const xor = (model, item) => (dispatch, getState) => {
  const state = _get(getState(), model, []);
  const stateWithoutItem = state.filter(stateItem => !isEqual(stateItem, item));
  const value = (state.length === stateWithoutItem.length) ? [...state, item] : stateWithoutItem;

  dispatch({
    type: actionTypes.CHANGE,
    model,
    value,
  });
};

const push = (model, item = null) => (dispatch, getState) => {
  const collection = _get(getState(), model);
  const value = [...(collection || []), item];

  dispatch({
    type: actionTypes.CHANGE,
    model,
    value,
  });
};

const toggle = model => (dispatch, getState) => {
  const value = !_get(getState(), model);

  dispatch({
    type: actionTypes.CHANGE,
    model,
    value,
  });
};

const filter = (model, iterate = a => a) => (dispatch, getState) => {
  const collection = _get(getState(), model);
  const value = collection.filter(iterate);

  dispatch({
    type: actionTypes.CHANGE,
    model,
    value,
  });
};

const reset = model => ({
  type: actionTypes.RESET,
  model,
});

const map = (model, iterate = a => a) => (dispatch, getState) => {
  const collection = _get(getState(), model, []);
  const value = collection.map(iterate);

  dispatch({
    type: actionTypes.CHANGE,
    model,
    value,
  });
};

const remove = (model, index) => (dispatch, getState) => {
  const collection = _get(getState(), model, []);

  dispatch({
    type: actionTypes.CHANGE,
    model,
    value: icepick.splice(collection, index, 1),
  });
};

const move = (model, indexFrom, indexTo) => (dispatch, getState) => {
  const collection = _get(getState(), model, []);

  if (indexFrom >= collection.length || indexTo >= collection.length) {
    throw new Error(`Error moving array item: invalid bounds ${indexFrom}, ${indexTo}`);
  }

  const item = collection[indexFrom];
  const removed = icepick.splice(collection, indexFrom, 1);
  const inserted = icepick.splice(removed, indexTo, 0, item);

  dispatch({
    type: actionTypes.CHANGE,
    model,
    value: inserted,
  });
};

const merge = (model, values) => (dispatch, getState) => {
  const value = _get(getState(), model, {});

  dispatch({
    type: actionTypes.CHANGE,
    model,
    value: icepick.merge(value, values),
  });
};

const load = (model, values) => ({
  type: actionTypes.LOAD,
  model,
  value: values,
});

export default {
  change,
  filter,
  map,
  merge,
  push,
  remove,
  move,
  reset,
  toggle,
  xor,
  load,
};
