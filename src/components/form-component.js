import React, { Component, PropTypes } from 'react';
import shallowCompare from 'react/lib/shallowCompare';
import connect from 'react-redux/lib/components/connect';
import _get from '../utils/get';
import mapValues from '../utils/map-values';
import merge from '../utils/merge';
import identity from 'lodash/identity';

import actions from '../actions';
import {
  getValidity,
  getForm,
  invertValidators,
  invertValidity,
} from '../utils';
import { getField } from '../reducers/form-reducer';

class Form extends Component {
  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleValidSubmit = this.handleValidSubmit.bind(this);
    this.handleInvalidSubmit = this.handleInvalidSubmit.bind(this);
    this.attachNode = this.attachNode.bind(this);
  }

  componentDidMount() {
    this.validate(this.props, true);
  }

  componentWillReceiveProps(nextProps) {
    const { validateOn } = this.props;

    if (validateOn !== 'change') return;

    this.validate(nextProps);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState);
  }

  attachNode(node) {
    if (!node) return;

    this._node = node;

    this._node.submit = this.handleSubmit;
  }

  validate(nextProps, initial = false) {
    const {
      validators,
      errors,
      model,
      dispatch,
      formValue,
      modelValue,
    } = this.props;

    if (!formValue) return;

    if (!validators && !errors && (modelValue !== nextProps.modelValue)) {
      if (!formValue.valid) {
        dispatch(actions.setValidity(model, true));
      }

      return;
    }

    let validityChanged = false;

    const fieldsValidity = mapValues(validators, (validator, field) => {
      const nextValue = field
        ? _get(nextProps.modelValue, field)
        : nextProps.modelValue;

      const currentValue = field
        ? _get(modelValue, field)
        : modelValue;

      if (!initial && (nextValue === currentValue)) {
        return getField(formValue, field).validity;
      }

      validityChanged = true;

      const fieldValidity = getValidity(validator, nextValue);

      return fieldValidity;
    });

    const fieldsErrorsValidity = mapValues(errors, (errorValidator, field) => {
      const nextValue = field
        ? _get(nextProps.modelValue, field)
        : nextProps.modelValue;

      const currentValue = field
        ? _get(modelValue, field)
        : modelValue;

      if (!initial && (nextValue === currentValue)) {
        return getField(formValue, field).errors;
      }

      validityChanged = true;

      const fieldErrors = getValidity(errorValidator, nextValue);

      return fieldErrors;
    });

    const fieldsErrors = merge(
      invertValidity(fieldsValidity),
      fieldsErrorsValidity
    );

    // Compute form-level validity
    if (!fieldsValidity.hasOwnProperty('') && !fieldsErrorsValidity.hasOwnProperty('')) {
      fieldsErrors[''] = false;
    }

    if (validityChanged) {
      dispatch(actions.setFieldsErrors(model, fieldsErrors));
    }
  }

  handleValidSubmit() {
    const {
      dispatch,
      model,
      modelValue,
      onSubmit = identity,
    } = this.props;

    dispatch(actions.setPending(model));

    return onSubmit(modelValue);
  }

  handleInvalidSubmit() {
    const {
      dispatch,
      model,
    } = this.props;

    dispatch(actions.setSubmitFailed(model));
  }

  handleReset(e) {
    if (e) e.preventDefault();

    const {
      model,
      dispatch,
    } = this.props;

    dispatch(actions.reset(model));
  }

  handleSubmit(e) {
    if (e) e.preventDefault();

    const {
      model,
      modelValue,
      formValue,
      onSubmit,
      dispatch,
      validators,
      errors: errorValidators,
    } = this.props;

    const formValid = formValue
      ? formValue.valid
      : true;

    if (!validators && onSubmit && formValid) {
      onSubmit(modelValue);

      return modelValue;
    }

    const validationOptions = {
      onValid: this.handleValidSubmit,
      onInvalid: this.handleInvalidSubmit,
    };

    const finalErrorValidators = validators
      ? merge(invertValidators(validators), errorValidators)
      : errorValidators;

    dispatch(actions.validateFieldsErrors(
      model,
      finalErrorValidators,
      validationOptions));

    return modelValue;
  }

  render() {
    const { component, children, ...other } = this.props;

    return React.createElement(component,
      {
        ...other,
        onSubmit: this.handleSubmit,
        onReset: this.handleReset,
        ref: this.attachNode,
      }, children);
  }
}

Form.propTypes = {
  component: PropTypes.any,
  validators: PropTypes.object,
  errors: PropTypes.object,
  validateOn: PropTypes.oneOf([
    'change',
    'submit',
  ]),
  model: PropTypes.string.isRequired,
  modelValue: PropTypes.any,
  formValue: PropTypes.object,
  onSubmit: PropTypes.func,
  dispatch: PropTypes.func,
  children: PropTypes.node,
};

Form.defaultProps = {
  validateOn: 'change',
  component: 'form',
};

function mapStateToProps(state, { model }) {
  const modelString = typeof model === 'function'
    ? model(state)
    : model;

  return {
    modelValue: _get(state, modelString),
    formValue: getForm(state, modelString),
  };
}

export default connect(mapStateToProps)(Form);
