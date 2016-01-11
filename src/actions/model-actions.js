import curry from 'lodash/function/curry';
import endsWith from 'lodash/string/endsWith';
import get from 'lodash/object/get';
import cloneDeep from 'lodash/lang/cloneDeep';
import _filter from 'lodash/collection/filter';
import _map from 'lodash/collection/map';
import _pullAt from 'lodash/array/pullAt';
import isEqual from 'lodash/lang/isEqual';

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

const change = curry((model, value) => ({
  type: `rsf/change`,
  model,
  value: getValue(value),
  multi: isMulti(model)
}));

const xor = (model, item) => (dispatch, getState) => {
  let state = get(getState(), model, []);

  let stateWithoutItem = _filter(state, (stateItem) => !isEqual(stateItem, item));

  let value = state.length === stateWithoutItem.length
    ? [...state, item]
    : stateWithoutItem;

  dispatch({
    type: `rsf/change`,
    model,
    value
  });
}

const push = (model, item = null) => (dispatch, getState) => {
  let collection = get(getState(), model);
  let value = [...collection, item];

  dispatch({
    type: `rsf/change`,
    model,
    value
  });
}

const toggle = (model) => (dispatch, getState) => {
  let value = !get(getState(), model);

  dispatch({
    type: `rsf/change`,
    model,
    value
  });
}

const filter = (model, iteratee = (a) => a) => (dispatch, getState) => {
  let collection = get(getState(), model);
  let value = _filter(collection, iteratee);

  dispatch({  
    type: `rsf/change`,
    model,
    value
  });
};

const reset = (model) => ({
  type: `rsf/reset`,
  model
});

const map = (model, iteratee = (a) => a) => (dispatch, getState) => {
  let collection = get(getState(), model);
  let value = _map(collection, iteratee);

  dispatch({  
    type: `rsf/change`,
    model,
    value
  });
};

const remove = (model, index) => (dispatch, getState) => {
  let collection = cloneDeep(get(getState(), model));
  
  let value = (_pullAt(collection, index), collection);

  dispatch({  
    type: `rsf/change`,
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
  remove
}
