import React, { Component, PropTypes } from 'react';
import connect from 'react-redux/lib/components/connect';
import _get from '../utils/get';
import map from 'lodash/map';
import compact from 'lodash/compact';
import iteratee from 'lodash/_baseIteratee';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';

import { getFieldFromState, getForm } from '../utils';

function showErrors(field, form, show = true) {
  if (typeof show === 'function') {
    return show(field, form);
  }

  if (!isArray(show)
    && typeof show !== 'object'
    && typeof show !== 'string') {
    return !!show;
  }

  return iteratee(show)(field);
}

class Errors extends Component {
  shouldComponentUpdate({ fieldValue, formValue }) {
    return fieldValue !== this.props.fieldValue
      || formValue !== this.props.formValue;
  }

  mapErrorMessages(errors) {
    const { messages } = this.props;

    if (typeof errors === 'string') {
      return this.renderError(errors, 'error');
    }

    if (!errors) return null;

    return compact(map(errors, (error, key) => {
      const message = messages[key];

      if (error) {
        if (message) {
          return this.renderError(message, key);
        } else if (typeof error === 'string') {
          return this.renderError(error, key);
        } else if (isPlainObject(error)) {
          return this.mapErrorMessages(error);
        }
      }

      return false;
    })).reduce((a, b) => a.concat(b), []);
  }

  renderError(message, key) {
    const {
      component,
      model,
      modelValue,
      fieldValue,
    } = this.props;

    const errorProps = {
      key,
      model,
      modelValue,
      fieldValue,
    };

    const messageString = typeof message === 'function'
      ? message(modelValue)
      : message;

    if (!messageString) return null;

    return React.createElement(
      component,
      errorProps,
      messageString);
  }

  render() {
    const {
      fieldValue,
      fieldValue: {
        valid,
        errors,
      },
      formValue,
      show,
      wrapper,
    } = this.props;

    if (!showErrors(fieldValue, formValue, show)) {
      return null;
    }

    const errorMessages = valid
      ? null
      : this.mapErrorMessages(errors);

    if (!errorMessages) return null;

    return React.createElement(
      wrapper,
      this.props,
      errorMessages);
  }
}

Errors.propTypes = {
  // Computed props
  modelValue: PropTypes.any,
  formValue: PropTypes.object,
  fieldValue: PropTypes.object,

  // Provided props
  model: PropTypes.string.isRequired,
  messages: PropTypes.objectOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.bool,
  ])),
  show: PropTypes.any,
  wrapper: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.element,
  ]),
  component: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.element,
  ]),
};

Errors.defaultProps = {
  wrapper: 'div',
  component: 'span',
  messages: {},
  show: true,
};

function mapStateToProps(state, { model }) {
  const modelString = typeof model === 'function'
    ? model(state)
    : model;

  const formValue = getForm(state, modelString);
  const fieldValue = getFieldFromState(state, modelString);

  return {
    model: modelString,
    modelValue: _get(state, modelString),
    formValue,
    fieldValue,
  };
}

export default connect(mapStateToProps)(Errors);
