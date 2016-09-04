import actionTypes from '../../action-types';
import updateField from '../../utils/update-field';
import icepick from 'icepick';

export default function setFocusActionReducer(state, action, localPath) {
  if (action.type !== actionTypes.FOCUS) {
    return state;
  }

  return updateField(state, localPath, {
    focus: true,
  });
}
