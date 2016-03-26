
// TODO: Fix all eslint issues
import React, { Component, PropTypes } from 'react';
import connect from 'react-redux/lib/components/connect';
import _get from 'lodash/get';
import identity from 'lodash/identity';
import mapValues from 'lodash/mapValues';

import actions from '../actions';
import { getValidity, isValid, isInvalid } from '../utils';

class Form extends Component {
  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.validate(this.props, true);
  }

  componentWillReceiveProps(nextProps) {
    const { validateOn } = this.props;

    if (validateOn !== 'change') return;

    this.validate(nextProps);
  }

  validate(nextProps, initial = false) {
    /* eslint-disable react/prop-types */
    const {
      validators,
      errors,
      model,
      dispatch,
    } = this.props;
    /* eslint-enable react/prop-types */

    /* eslint-disable consistent-return */
    const validity = mapValues(validators, (validator, field) => {
      const fieldModel = [model, field].join('.');
      const value = _get(nextProps, fieldModel);

      if (!initial && (value === _get(this.props, fieldModel))) return;

      const fieldValidity = getValidity(validator, value);

      dispatch(actions.setValidity(fieldModel, fieldValidity));

      return fieldValidity;
    });

    const errorsValidity = mapValues(errors, (errorValidator, field) => {
      const fieldModel = [model, field].join('.');
      const value = _get(nextProps, fieldModel);

      if (!initial && (value === _get(this.props, fieldModel))) return;

      const fieldErrors = getValidity(errorValidator, value);

      dispatch(actions.setErrors(fieldModel, fieldErrors));

      return fieldErrors;
    });
    /* eslint-enable consistent-return */

    return isValid(validity) && !isInvalid(errorsValidity);
  }

  handleSubmit(e) {
    e.preventDefault();

    /* eslint-disable react/prop-types */
    const {
      model,
      onSubmit,
    } = this.props;
    /* eslint-enable react/prop-types */

    const modelValue = _get(this.props, model);

    const isFormValid = this.validate(this.props, true);

    if (onSubmit && isFormValid) {
      return onSubmit(modelValue);
    }

    return modelValue;
  }

  render() {
    /* eslint-disable react/prop-types */
    return (
      <form
        {...this.props}
        onSubmit={this.handleSubmit}
      >
        { this.props.children }
      </form>
    );
    /* eslint-enable react/prop-types */
  }
}

Form.propTypes = {
  validators: PropTypes.object,
  validateOn: PropTypes.oneOf([
    'change',
    'submit',
  ]),
  model: PropTypes.string.isRequired,
  onSubmit: PropTypes.func,
};

Form.defaultProps = {
  validateOn: 'change',
};

export default connect(identity)(Form);
