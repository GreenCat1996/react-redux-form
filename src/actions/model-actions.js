import endsWith from 'lodash/endsWith';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import _filter from 'lodash/filter';
import _map from 'lodash/map';
import _pullAt from 'lodash/pullAt';
import isEqual from 'lodash/isEqual';
import _merge from 'lodash/merge';

import * as actionTypes from '../action-types';

function isEvent(event) {
  return !!(event && event.stopPropagation && event.preventDefault);
}

function getValue(event) {
  return isEvent(event)
    ? event.target.value
    : event;
}

function isMulti(model) {
  return endsWith(model, '[]');
}

const change = (model, value) => ({
  type: actionTypes.CHANGE,
  model,
  value: getValue(value),
  multi: isMulti(model)
});

const xor = (model, item) => (dispatch, getState) => {
  let state = get(getState(), model, []);

  let stateWithoutItem = _filter(state, (stateItem) => !isEqual(stateItem, item));

  let value = state.length === stateWithoutItem.length
    ? [...state, item]
    : stateWithoutItem;

  dispatch({
    type: actionTypes.CHANGE,
    model,
    value
  });
}

const push = (model, item = null) => (dispatch, getState) => {
  let collection = get(getState(), model);
  let value = [...(collection || []), item];

  dispatch({
    type: actionTypes.CHANGE,
    model,
    value
  });
}

const toggle = (model) => (dispatch, getState) => {
  let value = !get(getState(), model);

  dispatch({
    type: actionTypes.CHANGE,
    model,
    value
  });
}

const filter = (model, iteratee = (a) => a) => (dispatch, getState) => {
  let collection = get(getState(), model);
  let value = collection.filter(iteratee);

  dispatch({  
    type: actionTypes.CHANGE,
    model,
    value
  });
};

const reset = (model) => ({
  type: actionTypes.RESET,
  model
});

const map = (model, iteratee = (a) => a) => (dispatch, getState) => {
  let collection = get(getState(), model);
  let value = _map(collection, iteratee);

  dispatch({  
    type: actionTypes.CHANGE,
    model,
    value
  });
};

const remove = (model, index) => (dispatch, getState) => {
  let collection = cloneDeep(get(getState(), model));
  
  let value = (_pullAt(collection, index), collection);

  dispatch({  
    type: actionTypes.CHANGE,
    model,
    value
  });
};

const merge = (model, values) => (dispatch, getState) => {
  let value = get(getState(), model, {});

  _merge(value, values);

  dispatch({
    type: actionTypes.CHANGE,
    model,
    value
  });
};

export {
  change,
  reset,
  xor,
  toggle,
  filter,
  reset,
  map,
  push,
  remove,
  merge
}
