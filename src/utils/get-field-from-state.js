import get from './get';
import toPath from './to-path';
import getForm from './get-form';
import isPlainObject from 'lodash/isPlainObject';

export default function getFieldFromState(state, modelString) {
  const form = (state && '$form' in state)
    ? state
    : getForm(state, modelString);

  if (!form) return null;

  if (!modelString.length) return form;

  const formPath = toPath(form.$form.model);
  const fieldPath = toPath(modelString).slice(formPath.length);
  const field = get(form, fieldPath);

  if (!field) return null;
  if (isPlainObject(field) && '$form' in field) return field.$form;

  return field;
}
