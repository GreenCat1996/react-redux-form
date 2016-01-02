import get from 'lodash/object/get';
import set from 'lodash/object/set';
import startsWith from 'lodash/string/startsWith';
import cloneDeep from 'lodash/lang/cloneDeep';
import isArray from 'lodash/lang/isArray';


function getSuperState(model, state) {
  return set(
    {},
    model,
    cloneDeep(state));
}

function createModelReducer(model, initialState = {}) {
  return (state = initialState, action) => {
    if (model && !startsWith(action.model, model)) {
      return state;
    }

    let superState = getSuperState(model, state);

    let collection = get(superState, action.model, []);

    switch (action.type) {
      case 'rsf/change':
        switch (action.method) {
          default:
          case 'change':
            if (action.model === model) {
              return action.value;
            }

            set(superState, action.model, action.value);

            return get(superState, model);

          case 'reset':
            set(superState, action.model, get(getSuperState(model, initialState), action.model));

            return get(superState, model);
        }

      default:
        return state;
    }
  }
}

export {
  createModelReducer
}
